import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  StatusBar,
  Pressable,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  TouchableOpacity,
  Easing,
  PanResponder,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import {BACKEND_HOST} from '@env';
const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
import AppointmentFormModalContent from './AppointmentFormModalContent';
import { doctorApi } from '../src/services/api';
import { io } from 'socket.io-client';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
import {
  ArrowLeft,
  CalendarDays,
  Phone,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const DoctorProfile = () => {
  const route = useRoute();
const navigation = useNavigation();
// Pull only the ID out of params
const doctorId = route.params?.doctor?.id;

// Local state for the fetched doctor
const [doctor, setDoctor]   = useState(null);
const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!doctorId) {return;}
    doctorApi.get(doctorId)
      .then(setDoctor)
      .catch(() => Alert.alert('Error','Unable to load profile'))
      .finally(() => setLoading(false));
  }, [doctorId]);

useEffect(() => {
  // console.log("Received Doctor Data in Profile:", doctor);
}, []);
// State to store selected date, available slots, and queue details
const [availableDates, setAvailableDates] = useState([]);
const [selectedDate, setSelectedDate] = useState(null);
const [availableSlots, setAvailableSlots] = useState([]);
const [selectedSlot, setSelectedSlot] = useState(null);
const [selectedScheduleId, setSelectedScheduleId] = useState(null);
const [doctorAvailable, setDoctorAvailable] = useState(true); // Track doctor's availability
const [queueVisible, setQueueVisible] = useState(false); // Show queue info after slot selection
const [queueLoading, setQueueLoading] = useState(false); // Track queue loading state

// Function to get next 7 available dates
const getAvailableDates = useCallback(() => {
   if (!doctor?.schedules) {return [];}   // ← nothing to do until doctor is loaded
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight (local time)

  const next7Days = [];
  let foundValidDate = false;

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Format date as YYYY-MM-DD (local time)
    const formattedDate = currentDate.toLocaleDateString('en-CA');


// Get slots for this day
  // Get slots for this day
  let slots = doctor.schedules.filter(slot =>
    // note: if you've updated to camelCase on the backend, use slot.dayOfWeek here:
    slot.dayOfWeek.toLowerCase() === dayName.toLowerCase()
  );

  if (i === 0) { // Today's date
    const now = new Date();

    slots = slots.filter((slot) => {
      // ← use `slot.from` and `slot.to`, not `s.from`
      const [slotStartHours, slotStartMinutes] = slot.from.split(':').map(Number);
      const [slotEndHours, slotEndMinutes]     = slot.to.split(':').map(Number);

      const slotStartTime = new Date(today);
      slotStartTime.setHours(slotStartHours, slotStartMinutes, 0, 0);

      const slotEndTime = new Date(today);
      slotEndTime.setHours(slotEndHours, slotEndMinutes, 0, 0);

      return slotEndTime > now; // keep ongoing or future slots
    });
  }



foundValidDate = true; // At least one valid date exists

    next7Days.push({
      date: formattedDate,
      day: dayName,
      slots: slots,
    });

    if (!foundValidDate) {
      foundValidDate = true; // Mark that at least one valid date exists
    }
  }

  return next7Days;
}, [doctor]);

// Fetch next 7 days when component mounts
useEffect(() => {
  if (!doctor) {return;}
  const dates = getAvailableDates();
  setAvailableDates(dates);

  if (dates.length > 0) {
    const firstAvailableDate = dates[0].date;
    setSelectedDate(firstAvailableDate);

    const dateData = dates.find((d) => d.date === firstAvailableDate);
    if (dateData?.slots.length > 0) {
      setAvailableSlots(dateData.slots);
      setDoctorAvailable(true);
    } else {
      setAvailableSlots([]);
      setDoctorAvailable(false);
    }
  }
}, [doctor, getAvailableDates]);

const handleDateSelection = (date) => {
  setSelectedDate(date);
  const dateData = availableDates.find((d) => d.date === date);

  if (dateData?.slots.length > 0) {
    setAvailableSlots(dateData.slots);
    setDoctorAvailable(true);
    setSelectedSlot(null); // Reset selected slot
    setSelectedScheduleId(null); // Reset selected schedule ID
    setQueueVisible(false); // Hide queue information
  } else {
    setAvailableSlots([]);
    setDoctorAvailable(false);
    setSelectedSlot(null); // Reset selected slot
    setSelectedScheduleId(null); // Reset selected schedule ID
    setQueueVisible(false); // Hide queue information
  }
};


const [totalPatients, setTotalPatients] = useState(0); // Stores total queue patients
const [currentQueue, setCurrentQueue] = useState(0); // Stores currently serving queue number
const [bookingStartTime, setBookingStartTime] = useState(null);
const [, setBookingEndTime] = useState(null);
const [bookingWindow, setBookingWindow] = useState(false);
const [selectedSlotAddress, setSelectedSlotAddress] = useState(null); // Store selected slot address
const [selectedSlotFees, setSelectedSlotFees] = useState(null); // Store selected slot fees

const socketRef = useRef(null); // <-- Add this at the top of the component

const handleSlotSelection = (slot) => {
  if (!doctorAvailable) {
    return;
  }
  setSelectedSlot(slot);
  setSelectedScheduleId(slot.id);
  setQueueVisible(true);
  setQueueLoading(true);
  setBookingStartTime(slot.bookingStart);
  setBookingEndTime(slot.bookingEnd);
  setBookingWindow(slot.bookingWindow);
  setSelectedSlotAddress(slot.clinicAddress || 'No address available');
  setSelectedSlotFees(slot.fees || 'No fees available');
};

// Add this useEffect for real-time queue updates:
useEffect(() => {
  if (!selectedSlot || !selectedSlot.id || !selectedDate) {return;}
  setQueueLoading(true);
  // Clean up previous socket if any
  if (socketRef.current) {
    socketRef.current.disconnect();
  }
  // Create new socket
  const socket = io(`${BACKEND_HOST}`, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });
  socketRef.current = socket;
  // Emit to join the queue room
  socket.emit('schedule-queue-status', {
    scheduleId: selectedSlot.id,
    date: selectedDate,
  });
  // Listen for updates
  const eventName = `queue-updated-${selectedSlot.id}-${selectedDate}`;
  socket.on(eventName, (data) => {
    setTotalPatients(data.totalQueue ?? 0);
    setCurrentQueue(data.currentServing ?? 0);
    setQueueLoading(false);
  });
  socket.on('disconnect', () => {
    setQueueLoading(false);
  });
  // Cleanup on unmount or when slot/date changes
  return () => {
    socket.off(eventName);
    socket.disconnect();
    socketRef.current = null;
  };
}, [selectedSlot, selectedDate]);

// Clean up socket on component unmount
useEffect(() => {
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}, []);

  const [scheduleModalVisible, setScheduleModalVisible] = useState(false); // Controls modal visibility
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false); // Controls appointment modal visibility
  const [openedDay, setOpenedDay] = useState(null); // Tracks expanded day in the schedule modal

  // Animated values for schedule modal
  const fadeAnim = useRef(new Animated.Value(0)).current; // For overlay opacity
  const slideAnim = useRef(new Animated.Value(height)).current; // For modal slide

  // Animated values for appointment modal
  const panY = useRef(new Animated.Value(0)).current;

  // Animation states for each day
  const [dayAnimations, setDayAnimations] = useState({});

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!appointmentModalVisible) {
      panY.setValue(0);
    }
  }, [appointmentModalVisible, panY]);

  // Initialize animations for each day
 // Function to get today's day as a string (e.g., "Monday")
const getToday = () => {
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  return daysOfWeek[new Date().getDay()]; // Get today's day
};

useEffect(() => {
  if (!doctor?.schedules) {return;}           // ← guard against null
  const animations = {};
  const today = getToday();
  let foundToday = false;

  doctor.schedules.forEach(slot => {         // now safe
    animations[slot.dayOfWeek] = new Animated.Value(
      slot.dayOfWeek === today ? 100 : 0
    );
    if (slot.dayOfWeek === today) {foundToday = true;}
  });

  setDayAnimations(animations);
  setOpenedDay(foundToday ? today : null);
}, [doctor]);                               // ← watch doctor, not doctor.schedules


  // PanResponder for appointment modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dy: panY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          closeAppointmentModal();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleCallPress = () => {
    if (doctor.contactNumber) {
      const phoneNumber = `tel:${doctor.contactNumber}`;
      Linking.openURL(phoneNumber).catch((err) => {
        console.warn('Failed to open dialer', err);
        Alert.alert('Error', 'Unable to open dial pad.');
      });
    } else {
      Alert.alert('Info', 'Contact number not available.');
    }
  };

  const openAppointmentModal = () => {
    setAppointmentModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeAppointmentModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setAppointmentModalVisible(false);
    });
  };

  const openModal = () => {
    setScheduleModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setScheduleModalVisible(false);
      setOpenedDay(null);
    });
  };

  const toggleAccordion = (day) => {
    if (!dayAnimations[day]) {return;} // Ensure animation exists for this day

    if (openedDay === day) {
      // If already open, collapse it
      Animated.timing(dayAnimations[day], {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setOpenedDay(null);
      });
    } else {
      // Close any previously opened days
      Object.keys(dayAnimations).forEach((key) => {
        if (key !== day) {
          Animated.timing(dayAnimations[key], {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }).start();
        }
      });

      // Open the selected day
      Animated.timing(dayAnimations[day], {
        toValue: 100, // Adjust height as needed
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();

      setOpenedDay(day);
    }
  };




 if (loading || !doctor) {
     return (
       <View style={styles.container2}>

        <StatusBar backgroundColor="#E6E6E6" barStyle="dark-content" />
        <ShimmerPlaceHolder  style={styles.profilePictureShimmer}/>
        <ShimmerPlaceHolder  style={styles.profilePictureShimmer2}/>
        <ShimmerPlaceHolder  style={styles.ContactNumberstyle}/>
        <ShimmerPlaceHolder  style={styles.nameShimmer}/>
       <View style={styles.infoRow}>
       <ShimmerPlaceHolder  style={styles.infoRowdetail}/>
       <ShimmerPlaceHolder  style={styles.infoRowdetail}/>
       </View>
       </View>

     );
   }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#E3E9EE" barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backIcon}>
              <ArrowLeft color="#000" size={24} />
            </Pressable>
          </View>

          {/* Profile Image Section */}
          <View style={styles.profileContainer}>
            <View style={styles.imageWrapper}>
              <View style={styles.profileImageBorder}>
              <Image
    source={require('../assets/drProfile.png')}
    style={styles.profileImage}
  />
              </View>
            </View>
          </View>

          {/* Doctor Details */}
          <View style={styles.profileDetailsContainer}>
            <View style={styles.doctor}>
              <Text style={styles.name}>Dr. {doctor.name}</Text>
              <View style={styles.namecircle} />
              <Text style={styles.specialization}>{doctor.specialty}</Text>
            </View>
           {/* Address - Only show when a slot is selected */}
    {selectedSlot && (
      <Text style={styles.address}>
        {selectedSlotAddress || 'No address available'}
      </Text>
    )}

            {/* Schedule Button */}
            <Pressable
              style={styles.scheduleButton}
              onPress={openModal} // Open the schedule modal
            >
              <CalendarDays color="#164772" size={20} />
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </Pressable>


  {/* Fees - Only show when a slot is selected */}
  {selectedSlot && (
    <Text style={styles.waitTime}>
      Rs. {selectedSlotFees || 'No fees available'} / Appointment
    </Text>
  )}

            <View style={styles.datesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {availableDates.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateItem,
              selectedDate === item.date && styles.selectedDateItem,
            ]}
            onPress={() => handleDateSelection(item.date)}
          >
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
              })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    {/* Show "Select the slot to view the queue information of the doctor at the clinic" */}
    {doctorAvailable && availableSlots.length > 0 && !selectedSlot && ( // Only show if slots are available and no slot is selected
        <Text style={styles.selectSlotText}>
          Select the slot
        </Text>
      )}


    {/* Show Available Slots for the Selected Date */}
    {doctorAvailable ? (
      <View style={styles.slotsContainer}>
        {availableSlots.length > 0 ? (
          availableSlots.map((slot, index) => (
            <TouchableOpacity
      key={index}
      style={[
        styles.slotItem,
        selectedSlot?.id === slot.id && styles.selectedSlotItem, // Apply selected slot style
      ]}
      onPress={() => handleSlotSelection(slot)}
    >
      <Text style={[
        styles.slotText,
        selectedSlot?.id === slot.id && styles.selectedSlotText, // Apply white text color when selected
      ]}>
        {slot.from.slice(0,5)} - {slot.to.slice(0,5)}
      </Text>
    </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.unavailableText}>No slots available for this date</Text>
      )}
    </View>
  ) : (
    <Text style={styles.unavailableText}>Doctor is not available on this date</Text>
  )}

    {/* Queue Information for Selected Slot */}
    {queueVisible && selectedScheduleId && (
      <View style={styles.queueContainer}>
        <Text style={styles.queueHeader}>Queue Information</Text>
        {queueLoading ? (
          <>
            <ShimmerPlaceHolder style={styles.queueShimmer} />
            <ShimmerPlaceHolder style={styles.queueShimmer} />
          </>
        ) : (
          <>
            <Text style={styles.queueStatus}>
              <Text style={styles.boldText}>👥 Total Patients in Queue:</Text> {totalPatients}
            </Text>
            <Text style={styles.queueStatus}>
              <Text style={styles.boldText}>📢 Serving Queue Number:</Text> {currentQueue || 'Not started yet'}
            </Text>
          </>
        )}
      </View>
    )}

          </View>


          {/* Schedule Modal */}
          <Modal
            visible={scheduleModalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={closeModal}>
            <TouchableWithoutFeedback onPress={closeModal}>
              <View style={styles.modalOverlay}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}>
                  <TouchableWithoutFeedback>
                    <View>
                      <Pressable style={styles.closeButton} onPress={closeModal}>
                        <X color="#ffffff" size={24} />
                      </Pressable>
                      <Text style={styles.modalTitle}>Doctor's Schedule</Text>
                      <ScrollView>
                      {doctor.schedules?.map((slot, index) => (
    <View key={index} style={styles.scheduleItem}>
      <Pressable style={styles.dayRow} onPress={() => toggleAccordion(slot.dayOfWeek)}>
         <Text style={styles.scheduleDay}>
        {slot.dayOfWeek.charAt(0).toUpperCase() + slot.dayOfWeek.slice(1)}
       </Text>
        {openedDay === slot.dayOfWeek ? (
          <ChevronUp color="#000" size={20} />
        ) : (
          <ChevronDown color="#000" size={20} />
        )}
      </Pressable>

      <Animated.View
        style={{
          height: dayAnimations[slot.dayOfWeek] || 0, // Default to 0 if undefined
          overflow: 'hidden',
        }}
      >
        <View key={index} style={styles.clinicBox}>
      {/* use `slot`, not `s` */}
      <Text style={styles.clinicName}>🏥 {slot.clinicName}</Text>
      <Text style={styles.scheduleTime}>🕒 {slot.from} - {slot.to}</Text>
      <Text style={styles.clinicLocation}>📍 {slot.clinicAddress}</Text>
      <Text style={styles.clinicFees}>💰 Fees: ₹{slot.fees}</Text>
    </View>
      </Animated.View>
    </View>
  ))}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </ScrollView>

  {/* Book Appointment Button */}
  {/* Call & Book Appointment Buttons */}
  <View style={styles.buttonContainer}>
    {/* Call Button */}
    <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
      <Phone color="#000" size={20} />
    </TouchableOpacity>

    {/* Book Appointment Button */}
    <TouchableOpacity
    style={[
      styles.bookButton,
      selectedSlot && bookingWindow ? styles.bookButtonEnabled : styles.bookButtonDisabled,
    ]}
    onPress={openAppointmentModal}
    disabled={!selectedSlot || !bookingWindow} // Disabled until slot is selected & booking window is open
  >
  <Text style={styles.bookButtonText}>
    {!selectedSlot
      ? 'Book Appointment' // Default text when no slot is selected
      : !bookingWindow
      ? `Booking starts at ${bookingStartTime ? bookingStartTime : 'Not Available'} on ${new Date(selectedDate)
          .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
          .replace(/\//g, '-')}` // Show start time and selected date in DD-MM-YYYY format
      : 'Book Appointment'} {/* Enabled when bookingWindow is true */}
  </Text>
  </TouchableOpacity>
  </View>

    {/* Appointment Modal */}
    <Modal
      visible={appointmentModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeAppointmentModal}>
      <View style={styles.AppointmodalOverlay}>
        {/* Overlay to close the modal */}
        <TouchableOpacity
          style={styles.Appointoverlay}
          activeOpacity={1}
          onPress={closeAppointmentModal}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.AppointmodalContent,
            {
              transform: [
                {
                  translateY: Animated.add(
                    slideAnim,
                    panY.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [0, 0, 1],
                    })
                  ),
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Close Button */}
          <View style={styles.AppointcloseButtonWrapper}>
            <TouchableOpacity
              style={styles.AppointcloseButton}
              onPress={closeAppointmentModal}>
              <X color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>

          {/* Appointment Form */}
          <AppointmentFormModalContent
            onClose={closeAppointmentModal}
            doctor={doctor}
      selectedDate={selectedDate}
      selectedSlot={selectedSlot}
          />
        </Animated.View>
      </View>
    </Modal>
  </View>
</SafeAreaView>
);
};

const styles = StyleSheet.create({
  container2: {
    alignItems: 'center',
    backgroundColor: '#fff',
    height: height, // Responsive height
  },
  queueShimmer: {
    width: '80%',
    height: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  profilePictureShimmer: {
    width: width, // Full screen width
    height: height * 0.20000, // Adjusted to be responsive with 5 decimals
  },
  profilePictureShimmer2: {
    width: width * 0.45000,
    height: width * 0.45000,
    borderRadius: width * 0.22500,
    alignItems: 'center',
    marginTop: -(width * 0.45000) / 2,
    borderWidth: width * 0.05000,
    borderColor: '#fff',
  },
  nameShimmer: {
    width: width * 0.90000,
    height: height * 0.06000,
    marginTop: height * 0.02000,
    borderRadius: width * 0.02000,
  },
  infoRow: {
    flexDirection: 'row',
    width: width,
    marginTop: height * 0.02000,
    gap: width * 0.03000,
    paddingHorizontal: width * 0.05000,
  },
  infoRowdetail: {
    flexDirection: 'row',
    height: height * 0.06000,
    width: width * 0.44000,
    borderRadius: width * 0.02000,
  },
  ContactNumberstyle: {
    width: width * 0.40000,
    height: height * 0.02500,
    marginTop: -height * 0.01200,
    borderRadius: width * 0.05000,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    paddingVertical: height * 0.02,
    alignItems: 'center',
    height: height * 0.2,
    backgroundColor: '#E3E9EE',
  },
  backIcon: {
    paddingLeft: width * 0.05,
    paddingVertical: height * 0.02,
    marginTop: height * (-0.12),
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: -height * 0.11,
    paddingHorizontal: width * 0.04,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImageBorder: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.2,
    borderWidth: width * 0.06,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.08,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: width * 0.01,
  },
  profileImage: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
  },
  profileDetailsContainer: {
    padding: 16,
    alignItems: 'center', // Center the doctor's details
  },
  doctor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  namecircle: {
    width: width * 0.015,
    height: width * 0.015,
    borderRadius: width,
    backgroundColor: '#00000070',
    marginRight: width * -0.009,
    marginLeft: width * 0.02,
  },
  specialization: {
    fontSize: 16,
    color: '#1BBA8D',
    marginLeft: width * 0.03,
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: '#00000080',
    fontWeight: '500',
    textAlign: 'center', // Center the address text
  },
  waitTime: {
    color: '#164772',
    marginTop: height * 0.01,
    marginBottom: height * 0.01,
    fontWeight: '500',
    textAlign: 'center', // Center the wait time text
  },
  estimatedTimeContainer: {
    backgroundColor: '#0BC17210',
    padding: height * 0.01,
    borderRadius: width * 0.02,
    width: '100%', // Make the container full width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative', // Ensure the clock image is positioned correctly
  },

  estimatedTimeText: {
    color: '#000',
    fontSize: 14,
    width: '90%', // Adjust text width to accommodate the clock image
  },
  bookingNotAvailableContainer: {
    backgroundColor: '#16477230',
    padding: height * 0.01,
    borderRadius: width * 0.02,
    width: '100%', // Make the container full width
  },
  bookingNotAvailableText: {
    color: '#000',
    fontSize: 14,
  },
  boldGreenText: {
    color: '#164772',
    fontWeight: 'bold',
  },
  boldOrangeText: {
    color: '#F2994A',
    fontWeight: 'bold',
  },
  bookingConfirmedContainer: {
    backgroundColor: '#16477230',
    padding: height * 0.01,
    borderRadius: width * 0.02,
    width: '100%',
  },
  bookingConfirmedText: {
    color: '#000',
    fontSize: 14,
    textAlign: 'center', // Center the text
  },

  scheduleButton: {
    borderWidth: 1,
    borderColor: '#164772',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderRadius: width * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  selectedSlotText: {
    color: '#ffffff', // White text color for selected slot
  },
  scheduleButtonText: {
    color: '#164772',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: width * 0.015,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: width * 0.06,
    borderTopRightRadius: width * 0.06,
    padding: 20,
    elevation: 10,
    maxHeight: height * 0.7,
  },
  closeButton: {
    position: 'absolute',
    top: height * -0.08,
    right: width * 0.4,
    backgroundColor: '#00000060',
    zIndex: 1,
    borderRadius: width * 0.1,
    padding: width * 0.025,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: width * 0.01,
    textAlign: 'left',
    color: '#1BBA8D',
  },
  scheduleItem: {
    paddingVertical: height * 0.005,

  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
  },
  clinicLocation: {
    fontSize: 14,
    color: '#666',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.01,
    borderColor: '#E0E0E0',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.025,
    paddingBottom: height * 0.02,
    paddingTop: height * 0.002,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#000',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: width * 0.002,
    borderRadius: width * 0.05,
    marginRight: width * 0.02,
  },
  bookButton: {
    flex: 15,
    borderRadius: width * 0.015,
    padding: 12,
    alignItems: 'center',
    marginRight: width * 0.005,
  },
  bookButtonEnabled: {
    backgroundColor: '#164772',
  },
  bookButtonDisabled: {
    backgroundColor: '#16477240',
  },
  bookButtonText: {
    fontWeight: 'bold',
    color:'#ffffff',
  },
  bookButtonTextEnabled: {
    color: '#ffffff',
  },
  bookButtonTextDisabled: {
    color: '#9E9E9E',
  },
  AppointmodalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
    justifyContent: 'flex-end',
  },
  Appointoverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  AppointmodalContent: {
    height: height * 0.6, // Modal takes 80% of screen height
    backgroundColor: '#fff',
    borderTopLeftRadius: width * 0.05,
    borderTopRightRadius: width * 0.05,
    padding: width * 0.02,
    width: '100%',
    position: 'relative',
  },
  AppointcloseButtonWrapper: {
    width: width * 0.12, // Circle width
    height: width * 0.12, // Circle height
    borderRadius: width * 0.1, // Makes it a circle
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Transparent black effect
    alignItems: 'center',
    justifyContent: 'center',
    top: height * -0.07,
    left: width * 0.4,
  },
  AppointcloseButton: {
    position: 'absolute',
    alignContent: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  datesContainer: {
    flexDirection: 'row',
    marginBottom: height * 0.03,
    paddingHorizontal: width * 0.01,
    marginTop:height * 0.03,
  },
  dateItem: {
    backgroundColor: '#16477240',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 0.02,
    marginRight: width * 0.015,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#164772', // Selected Date Highlight
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  selectSlotText: {
    fontSize: 18,
    color: '#000', // You can change the color as needed
    textAlign: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
    fontWeight:'500',

  },

  // ✅ Styling for Available Slots
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: height * 0.01,
  },
  slotItem: {
    backgroundColor: '#ffffff',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 0.02,
    margin: width * 0.015,
    alignItems: 'center',
    borderWidth:width * 0.001,
    borderColor:'#000',
  },
  selectedSlotItem: {
    backgroundColor: '#1BBA8D', // Selected Slot Highlight
  },
  slotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },

  // ✅ Styling for "Doctor Not Available" Message
  unavailableText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F2994A', // Orange color for warning
    marginTop: height * 0.06,
  },

  // ✅ Queue Information Styling
  queueContainer: {
    backgroundColor: '#F5F5F5',
    padding: width * 0.025,
    borderRadius: width * 0.01,
    marginTop: height * 0.01,
    alignItems: 'center',
  },
  queueHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#164772',
  },
  queueStatus: {
    fontSize: 18,
    color: '#1BBA8D',
    marginTop: height * 0.005,
    fontWeight: 'bold',
  },
  boldText: {
    // fontWeight: "bold",
    color: '#000',
  },


});

export default DoctorProfile;
