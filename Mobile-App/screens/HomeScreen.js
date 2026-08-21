import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  StatusBar,
  FlatList,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin,ArrowRight, Receipt, Calendar,Headset  } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctors } from '../src/store/doctorsSlice';
import { appointmentApi } from '../src/services/api';
import {BACKEND_HOST} from '@env';

import { io } from 'socket.io-client';
const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

const { width, height } = Dimensions.get('window');

// Define specialities array at the top level
const specialities = [
  { id: '1', name: 'ENT', image: require('../assets/ENT.png') },
  { id: '2', name: 'Pediatrician', image: require('../assets/Pediatrics.png') },
  { id: '3', name: 'Gen.Phys', image: require('../assets/GeneralPhysician.png') },
  { id: '4', name: 'Gastrologist', image: require('../assets/Gastrology.png') },
  { id: '5', name: 'Dentist', image: require('../assets/f.png') },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  // const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  // const [loading, setLoading] = useState(false);


  const dispatch = useDispatch();
const { doctors, loading, error } = useSelector((state) => state.doctors);

useEffect(() => {
  dispatch(fetchDoctors()); // Fetch doctors when the screen loads
}, [dispatch]);
const [refreshing, setRefreshing] = useState(false);
const translateY = useRef(new Animated.Value(-100)).current; // Initially hidden

const handleRefresh = async () => {
  setRefreshing(true);

  // Show animation
  Animated.timing(translateY, {
    toValue: 0, // Moves into view
    duration: 500,
    useNativeDriver: true,
  }).start();

  // Fetch both doctors and upcoming appointments
  await dispatch(fetchDoctors());
  await fetchUpcomingAppointments();

  setTimeout(() => {
    setRefreshing(false);

    // Hide animation after refresh
    Animated.timing(translateY, {
      toValue: -100, // Moves out of view
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, 1500);
};

const calculateTimeDifference = (schedules) => {
  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[todayIndex];

  // Function to parse time from "HH:MM" format
  const parseTime = (timeString, dayOffset = 0) => {
    if (!timeString) {return null;}
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setDate(now.getDate() + dayOffset);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Step 1: Check today's schedule
 for (const schedule of schedules) {
    // match day_of_week to today (case-insensitive)
    if (schedule.day_of_week.toLowerCase() === today.toLowerCase()) {
      // use start_time/end_time instead of from/to
      const startDateTime = parseTime(schedule.start_time);
      const endDateTime   = parseTime(schedule.end_time);

      if (now >= startDateTime && now <= endDateTime) {
        return 0; // Available now
      } else if (now < startDateTime) {
        return (startDateTime - now) / (1000 * 60); // Difference in minutes
      }
    }
  }

  // Step 2: Find the next available day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (todayIndex + i) % 7;
    const nextDay = daysOfWeek[nextDayIndex];

   const nextDaySchedule = schedules.find(
      sch => sch.day_of_week.toLowerCase() === nextDay.toLowerCase()
    );
    if (nextDaySchedule) {
      const startDateTime = parseTime(nextDaySchedule.start_time, i);
      return (startDateTime - now) / (1000 * 60); // Difference in minutes
    }
  }

  return Infinity; // Not available
};

// Sort doctors based on availability
const sortedDoctors = doctors.slice().sort((a, b) => {
  const timeDifferenceA = calculateTimeDifference(a.schedules);
  const timeDifferenceB = calculateTimeDifference(b.schedules);
  return timeDifferenceA - timeDifferenceB;
});

const [queueMessage, setQueueMessage] = useState('');
const [queueMessageColor, setQueueMessageColor] = useState('#FFCC00'); // Default color
const [showQueueMessage, setShowQueueMessage] = useState(false);
const queueMessageAnim = useRef(new Animated.Value(-50)).current; // Initially hidden

const [, setUpcomingAppointments] = useState([]);
const [nearestAppointment, setNearestAppointment] = useState(null);
const [peopleAhead, setPeopleAhead] = useState(0); // Track real-time queue position
const [receiptVisible, setReceiptVisible] = useState(false);
const [, setSkippedAppointmentMessage] = useState('');
const { patientId, authToken } = useSelector((state) => state.auth);
useEffect(() => {
  if (!patientId) {return;} // don't call if still null
  fetchUpcomingAppointments();
}, [patientId, fetchUpcomingAppointments]);
useEffect(() => {
  console.log('token →', authToken, 'patientId →', patientId);
}, [authToken, patientId]);

  const [isPeopleAheadLoading, setIsPeopleAheadLoading] = useState(true); // Add loading state for peopleAhead
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [, setImageError] = useState(false);
useEffect(() => {
  if (!nearestAppointment || !nearestAppointment.id) {return;}

  setIsPeopleAheadLoading(true); // Always start loading when appointment changes

  const socket = io(`${BACKEND_HOST}`, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    forceNew: true,
    autoConnect: true,
  });

  const eventName = `queue-position-updated-${nearestAppointment.id}`;

  socket.emit('check-queue-status', { appointmentId: nearestAppointment.id });

  socket.on(eventName, (data) => {
    console.log('WebSocket queue update:', data); // <-- Debug log
    if (data?.appointmentId === nearestAppointment?.id && typeof data.peopleAhead === 'number') {
      setPeopleAhead(Number(data.peopleAhead));
      setIsPeopleAheadLoading(false);
    }
  });

  // Fallback: stop shimmer after 5 seconds if no update
  const fallback = setTimeout(() => {
    setIsPeopleAheadLoading(false);
    if (typeof peopleAhead !== 'number') {setPeopleAhead(-1);} // Show "Not available"
  }, 5000);

  return () => {
    socket.off(eventName);
    socket.disconnect();
    clearTimeout(fallback);
  };
  }, [nearestAppointment, peopleAhead]);
const [queueMessageTextColor, setQueueMessageTextColor] = useState('#000000'); // Default text color
useEffect(() => {
  if (!nearestAppointment) {
    setPeopleAhead(null); // Reset peopleAhead when there is no appointment
    return;
  }

  let message = '';
  let bgColor = '#FFCC00'; // Default yellow for 4 people ahead
  let textColor = '#000000'; // Default text color

  if (nearestAppointment.status === 'skipped') {
    message = 'Your appointment is skipped. Please contact the clinic to reschedule or cancel.';
    bgColor = '#FF0000'; // Red for skipped status
    textColor = '#FFFFFF'; // White text for better contrast
  } else if (nearestAppointment.status !== 'completed' && peopleAhead >= 0) {
    if (peopleAhead === 4) {
      message = 'Only 4 people ahead of you, please reach the clinic as soon as possible.';
      bgColor = '#48CAE4'; // Yellow
      textColor = '#000000'; // Black text
    } else if (peopleAhead === 3) {
      message = 'Only 3 people ahead, get ready for your turn.';
      bgColor = '#FFA500'; // Orange
      textColor = '#000000'; // Black text
    } else if (peopleAhead === 2) {
      message = 'Only 2 people ahead, your turn is coming soon!';
      bgColor = '#FF4500'; // Red
      textColor = '#FFFFFF'; // White text
    } else if (peopleAhead === 1) {
      message = 'You are next! Please be prepared.';
      bgColor = '#1BBA8D'; // Green
      textColor = '#FFFFFF'; // White text
    } else if (peopleAhead === 0) {
      message = 'It\'s your turn! Please proceed immediately.';
      bgColor = '#1BBA8D'; // Bright green for urgency
      textColor = '#FFFFFF'; // White text
    }
  }

  if (message) {
    setQueueMessage(message);
    setQueueMessageColor(bgColor);
    setQueueMessageTextColor(textColor); // Set text color dynamically
    setShowQueueMessage(true);

    Animated.timing(queueMessageAnim, {
      toValue: 0, // Slide down into view
      duration: 300,
      useNativeDriver: true,
    }).start();
  } else {
    Animated.timing(queueMessageAnim, {
      toValue: -50, // Slide up out of view
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setQueueMessage('');
      setShowQueueMessage(false);
    });
  }
}, [peopleAhead, nearestAppointment?.status, nearestAppointment, queueMessageAnim]); // Add nearestAppointment as a dependency

const fetchUpcomingAppointments = useCallback(async () => {
  try {
    const appointments = await appointmentApi.forPatient(patientId);
    if (appointments.length === 0) {
      setUpcomingAppointments([]);
      setNearestAppointment(null);
      setSkippedAppointmentMessage('');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let soonest = null;
    let soonestDate = null;
    appointments.forEach((appointment) => {
      let appointmentDate = null;
      if (appointment.date) {
        const [year, month, day] = appointment.date.split('-').map(Number);
        appointmentDate = new Date(year, month - 1, day);
      } else {
        return;
      }
      const queueNumber = appointment.queueNumber ?? appointment.queue_number ?? appointment.queueNo;
      const specialization = appointment.schedule?.doctor?.specialization || '';
      const doctorName = appointment.schedule?.doctor?.name || '';
      const clinicName = appointment.schedule?.clinicName || '';
      const clinicAddress = appointment.schedule?.clinicAddress || '';
      const fees = appointment.schedule?.fees ?? 0;
      const from = appointment.schedule?.from ?? appointment.schedule?.start_time ?? '';
      const to = appointment.schedule?.to ?? appointment.schedule?.end_time ?? '';
      const timeSlot = from && to ? `${from.slice(0,5)} - ${to.slice(0,5)}` : 'N/A';
      const formattedDate = `${String(appointmentDate.getDate()).padStart(2, '0')}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${appointmentDate.getFullYear()}`;
      if (
        appointmentDate >= today &&
        appointment.status !== 'completed' &&
        appointment.status !== 'cancelled' &&
        appointment.status !== 'skipped'
      ) {
        if (!soonestDate || appointmentDate < soonestDate) {
          soonest = {
            ...appointment,
            queueNumber,
            formattedDate,
            appointmentDate,
            doctorName,
            specialization,
            clinicName,
            clinicAddress,
            fees,
            timeSlot,
          };
          soonestDate = appointmentDate;
        }
      }
    });

    setNearestAppointment(soonest);
    setUpcomingAppointments(soonest ? [soonest] : []);
  } catch (err) {
    console.error('Error fetching upcoming appointments:', err);
  }
}, [patientId]);
useEffect(() => {
  if (!nearestAppointment) {return;}

  const checkSlotTime = () => {
    const now = new Date();
    const [startTime, endTime] = nearestAppointment.timeSlot.split(' - ');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const slotStart = new Date();
    slotStart.setHours(startHour, startMinute, 0, 0);

    const slotEnd = new Date();
    slotEnd.setHours(endHour, endMinute, 0, 0);

    if (now > slotEnd) {
      // Slot time is over, hide the queue message
      setQueueMessage('');
      setShowQueueMessage(false);
    }
  };

  // Check slot time every minute
  const interval = setInterval(checkSlotTime, 60000); // 60000ms = 1 minute

  // Initial check
  checkSlotTime();

  return () => clearInterval(interval); // Cleanup interval on unmount
}, [nearestAppointment]);
// Fetch appointments when screen loads
useEffect(() => {
  fetchUpcomingAppointments();
}, [fetchUpcomingAppointments]);

const getNearestUpcomingTime = (schedules) => {
  if (!schedules || schedules.length === 0) {
    return 'Not available';
  }

  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[todayIndex];

  // Function to parse time from "HH:MM" format
  const parseTime = (timeString, dayOffset = 0) => {
    if (!timeString) {return null;}
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setDate(now.getDate() + dayOffset);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Step 1: Check today's schedule
  for (const schedule of schedules) {
    if (schedule.day_of_week.toLowerCase() === today.toLowerCase()) {
      const startDateTime = parseTime(schedule.start_time);
      const endDateTime   = parseTime(schedule.end_time);

      if (now >= startDateTime && now <= endDateTime) {
        return `Available today until ${schedule.end_time.slice(0,5)}`;
      } else if (now < startDateTime) {
        return `Available today at ${schedule.start_time.slice(0,5)}`;
      }
    }
  }

  // Step 2: Find the next available day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (todayIndex + i) % 7;
    const nextDay = daysOfWeek[nextDayIndex];

    const nextDaySchedule = schedules.find(
      sch => sch.day_of_week.toLowerCase() === nextDay.toLowerCase()
    );
    if (nextDaySchedule) {
      return `Available on ${nextDay} at ${nextDaySchedule.start_time.slice(0,5)}`;
    }
  }

  return 'Not available';
};
const renderBoldText = (text) => {
  const parts = text.split(''); // Split the text by the bold markers
  return (
    <Text>
      {parts.map((part, index) =>
        index % 2 === 1 ? ( // Odd indices are bold
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {part}
          </Text>
        ) : (
          part // Even indices are normal text
        )
      )}
    </Text>
  );
};
  const searchLabels = useMemo(() => ['Doctors', 'Specialities'], []);

  // *Typing Effect for Search Placeholder*
  useEffect(() => {
    let typingInterval, erasingInterval;

    if (isTyping) {
      typingInterval = setInterval(() => {
        setCurrentPlaceholder(prev => {
          const fullLabel = searchLabels[currentLabelIndex];
          if (prev.length < fullLabel.length) {
            return fullLabel.slice(0, prev.length + 1);
          } else {
            clearInterval(typingInterval);
            setIsTyping(false);
            return prev;
          }
        });
      }, 150);
    } else {
      setTimeout(() => {
        erasingInterval = setInterval(() => {
          setCurrentPlaceholder(prev => {
            if (prev.length > 0) {
              return prev.slice(0, -1);
            } else {
              clearInterval(erasingInterval);
              setIsTyping(true);
              setCurrentLabelIndex(
                prevIndex => (prevIndex + 1) % searchLabels.length
              );
              return prev;
            }
          });
        }, 100);
      }, 1500);
    }

    return () => {
      clearInterval(typingInterval);
      clearInterval(erasingInterval);
    };
  }, [isTyping, currentLabelIndex, searchLabels]);

  // Auto-slide carousel
  const carouselItems = useMemo(() => [
    { id: 1, image: require('../assets/promo.jpg') },
    { id: 2, image: require('../assets/promo2.jpg') },
    { id: 3, image: require('../assets/promo.jpg') },
  ], []);

  useEffect(() => {
    if (!carouselItems || carouselItems.length === 0) {return;}

    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => {
        const nextSlide = (prevSlide + 1) % carouselItems.length;

        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({
            animated: true,
            offset: nextSlide * width, // Moves to the correct image
          });
        }

        return nextSlide;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [carouselItems]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <Pressable onPress={() => dispatch(fetchDoctors())} style={{ marginTop: 10, padding: 10, backgroundColor: '#1BBA8D', borderRadius: 5 }}>
          <Text style={{ color: 'white' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <ScrollView style={styles.container2}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.header2}>
          <View style={styles.headerContent2}>
            <ShimmerPlaceHolder style={styles.shimmerHeadericon1} />
            <ShimmerPlaceHolder style={styles.shimmerHeadertext} />
            <ShimmerPlaceHolder style={styles.shimmerHeadericon2} />
          </View>
          <ShimmerPlaceHolder style={styles.shimmerHeader} />
        </View>
        <View style={styles.container3}>
          <View style={styles.carouselWrapper}>
            <ShimmerPlaceHolder style={styles.carouselShimmer} />
          </View>
          <View style={styles.specialitiesHeader}>
            <ShimmerPlaceHolder style={styles.specialitiesShimmerHeader} />
            <ShimmerPlaceHolder style={styles.ViewAll} />
          </View>
          <View style={styles.specialitiesContainer}>
            {specialities.map((_, index) => (
              <View key={index} style={styles.specialityContainer}>
                <ShimmerPlaceHolder style={styles.specialityShimmerImage} />
                <ShimmerPlaceHolder style={styles.specialityShimmerText} />
              </View>
            ))}
          </View>
          <View style={styles.hospitalsHeader}>
            <ShimmerPlaceHolder style={styles.hospitalsShimmerHeader} />
          </View>
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <ShimmerPlaceHolder
                key={index}
                style={styles.hospitalCardShimmer}
              />
            ))}
        </View>
      </ScrollView>
    );
  }

  // Handlers
  const handleSearchBarClick = () => {
    navigation.navigate('SearchScreen', { shouldFocusInput: true });
  };

  const handleSpecialityClick = specialityName => {
    navigation.navigate('SearchScreen', {
      searchQuery: specialityName,
      shouldFocusInput: false,
    });
  };

  // const handleViewAllSpecialities = () => {
  //   setShowSpecialitiesModal(true);
  //   setViewAllLoading(true);
  //   setTimeout(() => {
  //     setViewAllLoading(false);
  //   }, 2000);
  // };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#164772" barStyle="dark-content" />

      <View style={styles.header}>
      <View style={styles.headerContent}>
  <Pressable style={styles.locationSelector}>
    <MapPin color="#FFFFFF" size={20} style={styles.mapPinIcon} />
    <Text style={styles.locationText}>Kharagpur, West Bengal</Text>
  </Pressable>

  {/* Headset Icon and Profile Picture */}
  <View style={styles.iconContainer}>
    {/* Headset Icon */}
    <TouchableOpacity onPress={() => setContactModalVisible(true)}>
      <Headset color="#FFFFFF" size={24} style={styles.headsetIcon} />
    </TouchableOpacity>

    {/* Profile Picture */}
    <Pressable
      style={styles.profileIcon}
      onPress={() => navigation.navigate('UserProfile')}
    >
      <Image
        source={require('../assets/user.png')}
        style={styles.prImage}
      />
    </Pressable>
  </View>
</View>

<Modal
  visible={contactModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setContactModalVisible(false)}
>
  <Pressable style={styles.modalOverlay} onPress={() => setContactModalVisible(false)}>
    <Pressable style={styles.CocontactModal}>
      <View style={styles.ComodalHeader}>
        <Text style={styles.ComodalTitle}>Contact Us</Text>
        <TouchableOpacity onPress={() => setContactModalVisible(false)}>
          {/* <Text style={styles.CocloseModal}>✕</Text> */}
        </TouchableOpacity>
      </View>

      <Text style={styles.ComodalText}>
        Contact us for any doubts or assistance. We're here to help!
      </Text>

      <View style={styles.CocontactInfo}>
        <Text style={styles.CocontactLabel}>Mobile Numbers:</Text>
        <Text style={styles.CocontactDetail}>+91 81580 94184 (Harsh Swami)</Text>
        <Text style={styles.CocontactDetail}>+91 99871 79937 (Shahid Mollick)</Text>

        <Text style={styles.CocontactLabel}>Email IDs:</Text>
        <Text style={styles.CocontactDetail}>harshswami138@gmail.com</Text>
        <Text style={styles.CocontactDetail}>shahidmollick13@gmail.com</Text>
      </View>
    </Pressable>
  </Pressable>
</Modal>

        <View style={styles.searchBarContainer}>
          <Pressable
            onPress={handleSearchBarClick}
            style={styles.searchBarTouchable}>
            <Search color="#000" size={18} />
            <TextInput
              style={styles.searchBarInput}
              placeholder={`Search ${currentPlaceholder}`}
              placeholderTextColor="#999999"
              editable={false} // Disable manual editing on HomeScreen
            />
          </Pressable>
        </View>

      </View>
      {showQueueMessage && nearestAppointment && (
  <Animated.View
    key={peopleAhead} // Force re-render when peopleAhead changes
    style={[
      styles.queueMessageContainer,
      {
        backgroundColor: queueMessageColor,
        transform: [{ translateY: queueMessageAnim }],
      },
    ]}
  >
    <Text style={[styles.queueMessageText, { color: queueMessageTextColor }]}>
      {queueMessage}
    </Text>
  </Animated.View>
)}
      <Animated.View style={[styles.loadingContainer, { transform: [{ translateY }] }]}>
  <ActivityIndicator size="large" color="#1BBA8D" />
  <Text style={styles.loadingText}>Refreshing...</Text>
</Animated.View>
      <ScrollView
      contentContainerStyle={{ paddingTop: 0 }} // Ensure content shifts down
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} style={styles.container}>
         {/* Carousel Section */}
         <View style={styles.carouselWrapper}>
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={carouselItems}
              keyExtractor={item => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => (
                <Image source={item.image} style={styles.carouselImage} />
              )}
              onScroll={event => {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const currentIndex = Math.round(contentOffsetX / width);
                setActiveSlide(currentIndex);
              }}
            />
          </View>
          <View style={styles.carouselDots}>

          {carouselItems.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.carouselDot,
                  activeSlide === index && styles.carouselDotActive,
                ]}
              />
            ))}
          </View>
        </View>
          {/* Show the nearest upcoming appointment as a container (if exists) */}
          {nearestAppointment && (
  <View>
    {/* Updated Appointment Header with Button */}
    <View style={styles.appointmentHeader}>
      <Text style={styles.appointmentTitle}>Upcoming Appointment</Text>
      <TouchableOpacity
        style={styles.viewAllAppointmentsButton}
        onPress={() => navigation.navigate('Appointments')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.viewAllAppointmentsButtonText}>View All</Text>
          <ArrowRight color="#000000" size={16} style={{ marginLeft: 5 }} />
        </View>
      </TouchableOpacity>
    </View>

    <View style={styles.appointmentContainer}>
      <View style={styles.appointmentDetails}>
        <View style={styles.dr}>
          <Text style={styles.doctorName}>Dr. {nearestAppointment.schedule.doctor.name}</Text>
          <View style={styles.circle} />
          <Text style={styles.Upspecialization}>{nearestAppointment.schedule.doctor.specialization}</Text>
        </View>

        <Text style={styles.queueText}>
          Queue Number: {nearestAppointment.queueNumber !== undefined && nearestAppointment.queueNumber !== null ? nearestAppointment.queueNumber : 'N/A'}
        </Text>

        <View style={styles.time}>
          <Calendar color="#555" size={14} style={{ marginRight: 5 }} />
          <Text style={styles.appointmentDate}>
            Date: <Text style={styles.bold}>{nearestAppointment.formattedDate},</Text>
          </Text>
          <Text style={styles.timeSlot}>
            Time Slot: <Text style={styles.bold}>{nearestAppointment.timeSlot}</Text>
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: nearestAppointment && nearestAppointment.queueNumber
                  ? `${Math.max(0, ((nearestAppointment.queueNumber - peopleAhead) / nearestAppointment.queueNumber) * 100)}%`
                  : '0%',
              },
            ]}
          />
        </View>

        {/* Shimmer effect for peopleAhead */}
        {isPeopleAheadLoading ? (
          <ShimmerPlaceHolder
            style={styles.peopleAheadShimmer}
            width={width * 0.3}
            height={height * 0.02}
          />
        ) : (
          <Text style={styles.peopleAhead}>
            {peopleAhead >= 0 ? `People ahead: ${peopleAhead}` : 'People ahead: Not available'}
          </Text>
        )}

        {/* View Receipt Button */}
        <TouchableOpacity
          style={styles.viewReceiptButton}
          onPress={() => setReceiptVisible(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Receipt color="#000000" size={16} style={{ marginRight: 5 }} />
            <Text style={styles.viewReceiptButtonText}>View Receipt</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}

{/* ✅ Receipt Modal */}
<Modal
  visible={receiptVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setReceiptVisible(false)}
>
  <Pressable style={styles.RemodalOverlay} onPress={() => setReceiptVisible(false)}>
    <Pressable style={styles.receiptModal}>
      <View style={styles.RemodalHeader}>
        <Text style={styles.modalTitle}>Appointment Receipt</Text>
        <TouchableOpacity onPress={() => setReceiptVisible(false)}>
          <Text style={styles.RecloseModal}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Receipt Details */}
      <View style={styles.receiptContent}>
  {nearestAppointment && nearestAppointment.schedule ? (
    <>
      <Text style={styles.receiptLabel}>Doctor:</Text>
      <Text style={styles.receiptText}>Dr. {nearestAppointment.schedule.doctor.name}</Text>

      <Text style={styles.receiptLabel}>Specialization:</Text>
      <Text style={styles.receiptText}>{nearestAppointment.schedule.doctor.specialization}</Text>

      <Text style={styles.receiptLabel}>Clinic:</Text>
      <Text style={styles.receiptText}>{nearestAppointment.schedule.clinicName}</Text>

      <Text style={styles.receiptLabel}>Address:</Text>
      <Text style={styles.receiptText}>{nearestAppointment.schedule.clinicAddress}</Text>

      <Text style={styles.receiptLabel}>Date:</Text>
      <Text style={styles.receiptText}>{nearestAppointment.formattedDate}</Text>

      <Text style={styles.receiptLabel}>Time Slot:</Text>
      <Text style={styles.receiptText}>{nearestAppointment.timeSlot}</Text>

      <Text style={styles.receiptLabel}>Fees:</Text>
      <Text style={styles.receiptText}>₹{nearestAppointment.schedule.fees}</Text>
    </>
  ) : (
    <Text style={styles.receiptText}>No receipt available</Text>
  )}
</View>
    </Pressable>
  </Pressable>
</Modal>


        {/* Specialities Section */}
        <View style={styles.specialitiesHeader}>
          <Text style={styles.section}>Doctors near you</Text>
          {/* <Pressable onPress={handleViewAllSpecialities}>
            <Text style={styles.viewAllButton}>
              View All ({specialities.length})
            </Text>
          </Pressable> */}
        </View>

        <View style={styles.specialitiesContainer}>
  {specialities.map((item, index) => (
    <Pressable
      key={item.id}
      style={[
        styles.specialityContainer,
        index >= 2 && styles.unavailableSpeciality, // Apply opacity to the last three
      ]}
      onPress={() => handleSpecialityClick(item.name)}
    >
      <Image source={item.image} style={styles.specialityImage} />
      <Text style={styles.specialityText}>{item.name}</Text>
    </Pressable>
  ))}
</View>


        {/* <Modal
  visible={showSpecialitiesModal}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowSpecialitiesModal(false)}
>
  <Pressable
    style={styles.modalOverlay}
    onPress={() => setShowSpecialitiesModal(false)}
  >
    <Pressable style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Specialists</Text>
        <Pressable onPress={() => setShowSpecialitiesModal(false)}>
          <Image
            source={require('../assets/down-icon.png')}
            style={styles.modalCloseIcon}
          />
        </Pressable>
      </View>

      <Text style={styles.modalSubtitle}>
        Consult with top Doctors across Specialities
      </Text>

      <FlatList
        data={viewAllLoading ? Array(6).fill({}) : specialities}
        numColumns={3}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        contentContainerStyle={styles.flatListContainer}
        renderItem={({ item, index }) =>
          viewAllLoading ? (
            <View style={styles.placeholderContainer}>
              <ShimmerPlaceHolder style={styles.shimmerImage} />
              <ShimmerPlaceHolder style={styles.shimmerText} />
            </View>
          ) : (
            <Pressable
              style={styles.specialityContainer}
              onPress={() => {
                setShowSpecialitiesModal(false);
                handleSpecialityClick(item.name);
              }}
            >
              <View style={styles.specialityImageContainer}>
              <View style={styles.specialitiesContainer}>
                <Image source={item.image} style={styles.specialityImage} />
              </View>
              <Text style={styles.moSpecialityText}>{item.name}</Text>
              </View>
            </Pressable>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </Pressable>
  </Pressable>
</Modal> */}


        {/* Doctors Section */}
        {/* <View style={styles.doctorsHeader}>
  <Text style={styles.sectionTitle}>Doctors Near You</Text>
</View> */}

{sortedDoctors.map(doctor => (
  <View key={doctor.id}>
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => {
        // AFTER: pass only the ID
navigation.navigate('DoctorProfile', { doctor: { id: doctor.id } });
      }}
    >
      <Image
        source={require('../assets/Avatar.png')}
        style={styles.profileImage}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
      <View style={styles.cardContent}>
        <View style={styles.nameSp}>
          <Text style={styles.itemName}>
            <Text>Dr. </Text>
            {doctor.name}
          </Text>
          <View style={styles.circle} />
          {doctor.specialization && (
            <Text style={styles.specialization}>{doctor.specialization}</Text>
          )}
        </View>
        <View style={styles.content}>
          {/* Display the nearest upcoming time */}
          <Text style={styles.availability}>
            {renderBoldText(getNearestUpcomingTime(doctor.schedules))}
          </Text>
        </View>
      </View>
    </Pressable>
    {/* Divider Below Each Card */}
    <View style={styles.divider} />
  </View>
))}


      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 0,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  peopleAheadShimmer: {
    marginTop: height * 0.007,
    borderRadius: width * 0.01,
  },
  loadingText: {
    marginTop: 5,
    fontSize: 14,
    color: '#333',
  },
  specialityImageContainer: {
    alignContent: 'center',
    justifyContent: 'center',
    width: width * 0.27,
    paddingHorizontal: 15,
  },

  flatListContainer: {
    marginTop: 10,
    alignContent: 'center',
    justifyContent: 'center',

  },
  placeholderContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '30%',
  },
  shimmerImage: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: width * 0.16,
    marginBottom: height * 0.005,
  },
  shimmerText: {
    width: width * 0.18,
    height: width * 0.03,
    borderRadius: width * 0.16,
  },

  container2: {
    backgroundColor: '#FFFFFF',
  },
  headerContent2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: width * 0.02,
    paddingTop: height * 0.009,
    gap: width * 0.002,
  },
  container3: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.03,
  },
  header2: {
    marginTop: height * 0.03,
    width: '50%',
    paddingBottom: height * 0.015,
    paddingHorizontal: width * 0.03,
    height: height * 0.13,
  },
  ViewAll: {
    height: height * 0.03,
    width: width * 0.2,
    borderRadius: width * 0.02,
  },
  specialitiesContainerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

  },
  hospitalsHeader: {
    marginTop: height * 0.02,
  },
  hospitalCard: {
    marginBottom: height * 0.021,
    borderRadius: width * 0.025,
  },
  shimmerHeader: {
    width: height * 0.46,
    height: height * 0.065,
    marginTop: height * 0.015,
    borderRadius: width * 0.03,
  },
  shimmerHeadertext: {
    width: '120%',
    height: height * 0.04,
    borderRadius: height * 0.02,
  },
  shimmerHeadericon1: {
    height: height * 0.04,
    width: height * 0.04,
    borderRadius: height * 0.02,
    marginRight: width * 0.015,
  },
  shimmerHeadericon2: {
    width: '100%',
    height: height * 0.04,
    borderRadius: height * 0.02,
    left: width * 0.23,
  },
  carouselShimmer: {
    width: width,
    height: height * 0.22,
    marginBottom: height * 0.018,
    borderRadius: width * 0.03,
  },
  specialitiesShimmerHeader: {
    height: height * 0.03,
    width: width * 0.25,
    borderRadius: width * 0.02,
  },
  specialityShimmerImage: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: width * 0.1,
  },
  specialityShimmerText: {
    width: width * 0.14,
    height: height * 0.017,
    borderRadius: width * 0.02,
    marginTop: height * 0.005,
    marginBottom: height * 0.025,
  },
  hospitalsShimmerHeader: {
    width: width * 0.38,
    height: height * 0.025,
    borderRadius: width * 0.02,
    marginBottom: height * 0.01,
  },
  hospitalCardShimmer: {
    width: '100%',
    height: height * 0.20,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
  },
  header: {
    backgroundColor: '#164772',
    paddingBottom: height * 0.018,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: height * 0.009,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: width * 0.02,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20, // Adjust spacing
  },
  profileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  prImage: {
    width: width * 0.07,
    height: width * 0.07,
    borderRadius: width * 0.05,
  },
  searchBarContainer: {
    marginTop: height * 0.01,
    backgroundColor: '#FFFFFF',
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.002,
    flexDirection: 'row',
    alignItems: 'center',
    height:height * 0.05,
  },
  searchBarTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginLeft: width * 0.01,
  },
  queueMessageContainer: {
    paddingVertical: height * 0.012,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
    queueMessageText: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.03,
  },
  carouselWrapper: {
    marginTop: height * 0.015,
    overflow: 'hidden',
  },
  carouselImage: {
    width: width,
    height: height * 0.22,
    resizeMode: 'cover',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: height * 0.01,
  },
  carouselDot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: width * 0.01,
    backgroundColor: '#CCCCCC',
    marginHorizontal: width * 0.01,
  },
  carouselDotActive: {
    backgroundColor: '#1BBA8D',
  },
  specialitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.005,
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#164772',
    marginBottom: height * 0.005,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    // marginBottom: height * 0.1,
  },
  viewAllButton: {
    fontSize: 14,
    color: '#1BBA8D',
    fontWeight: '700',
  },
  specialitiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: width * 0.01,
    marginBottom: height * 0.01,
    paddingHorizontal: width * 0.04,
  },
  specialityContainer: {
    alignItems: 'center',
    //  width: width * 0.18,
    marginHorizontal: width * 0.00, // Add horizontal margin for even spacing
  },
  // unavailableSpeciality: {
  //   opacity: 0.4, // Reduce opacity to indicate unavailability
  // },
  specialityImage: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.1,
    marginBottom: height * 0.00,

  },
  specialityText: {
    fontSize: 12,
    color: '#00000080',
    textAlign: 'center',
    justifyContent:'center',
    alignItems:'center',
    fontWeight:'600',
  },
  moSpecialityText:{

    textAlign:'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.03,
    paddingTop:width * 0.03,
    paddingBottom:width * 0.03,
},
cardPressed: {
    backgroundColor: '#16477215',
    borderRadius: 8,
},
divider: {
    height: 0.7,
    backgroundColor: '#16477220',
},
profileImage: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.1,
    marginRight: 15,
    marginLeft:width * (-0.02),
    backgroundColor: '#f0f0f0',
},
cardContent: {
    flex: 1,
    // flexDirection:'row'
},
content:{
    flex:1,
    // flexDirection:'row',
    // alignItems:'center',
},
nameSp:{
  flex:1,
  flexDirection:'row',
  alignContent:'center',
  alignItems:'center',
},
circle:{
    width: width * 0.015,
    height: width * 0.015,
    borderRadius: width,
    backgroundColor: '#1BBA8D',
    marginRight: width * 0.01,
    marginLeft: width * 0.01,

},
itemName: {
    fontSize: 14,
    color: '#000',
    fontWeight:'600',
},
specialization: {
    fontSize: 14,
    color: '#1BBA8D',
    fontWeight:'500',
},
availability: {
  fontSize: 14,
  color: '#00000080', // Green color for availability
  marginLeft: 0, // Add some spacing
  fontWeight: '500', // Medium weight
},

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: width * 0.05,
    borderTopRightRadius: width * 0.05,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseIcon: {
    width: width * 0.06,
    height: width * 0.06,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  appointmentContainer: {
    backgroundColor: '#F9F9F9',
    padding: width * 0.03,
    borderRadius: width * 0.02,
    marginTop: height * 0.007,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row', // Align items horizontally
    justifyContent: 'space-between', // Space between title and button
    alignItems: 'center', // Center items vertically
    marginBottom: height * 0.007,
    marginTop: height * 0.007,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#164772',
  },
  appointmentDetails: {
    flex: 1,
  },
  dr:{
    flex:1,
    flexDirection:'row',
    alignItems:'center',
    marginBottom:height * 0.005,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  Upspecialization: {
    fontSize: 16,
    color: '#666',
  },
  queueText: {
    fontSize: 14,
    color: '#444',
    marginBottom:height * 0.005,


  },
  // consultationTime: {
  //   fontSize: 14,
  //   color: '#777',
  // },
  time:{
    flex:1,
    flexDirection:'row',
    alignItems:'center',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#555',
    fontWeight: '300',
  },
  progressBarContainer: {
    width: '100%',
    height: height * 0.007,
    backgroundColor: '#E0E0E0',
    borderRadius: width * 0.01,
    marginTop: height * 0.01,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1BBA8D90',
    borderRadius: width * 0.009,
    transition: 'width 0.5s ease-in-out', // ✅ Smooth animation
  },
  peopleAhead: {
    fontSize: 12,
    color: '#444',
    textAlign: 'right',
    marginTop: height * 0.007,
  },
  timeSlot: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginLeft: width * 0.01,
  },

  viewReceiptButton: {
    borderWidth: width * 0.001,
    // borderColor: '#1BBA8D',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take up equal space
    marginRight: width * 0.01, // Add some spacing between buttons
    backgroundColor:'#ffffff',
    marginTop: height * 0.01,
  },
  viewAllAppointmentsButton: {
  borderColor: '#1BBA8D',
  paddingVertical: height * 0.009,
  paddingHorizontal: width * 0.02,
  borderRadius: width * 0.02,
  alignItems: 'center',
  justifyContent: 'center',
  },
  viewReceiptButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllAppointmentsButtonText: {
    color: '#000000',
  fontSize: 14,
  fontWeight: '600',
  },

  /* ✅ Receipt Modal Styles */
  RemodalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModal: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: width * 0.02,
    padding: width * 0.03,
    elevation: 5,
  },
  RemodalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#164772',
  },
  RecloseModal: {
    fontSize: 20,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  receiptContent: {
    marginTop: height * 0.01,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginTop: height * 0.01,
  },
  receiptText: {
    fontSize: 14,
    color: '#333',
    marginBottom: height * 0.007,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  CocontactModal: {
    width: '95%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
  },
  ComodalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ComodalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#164772',
  },
  CocloseModal: {
    fontSize: 20,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  ComodalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    // textAlign: 'center',
    fontWeight:'bold',
  },
  CocontactInfo: {
    marginTop: 10,
  },
  CocontactLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#164772',
    marginBottom: 5,
  },
  CocontactDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
});
