import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  StatusBar,
  Linking,
  Pressable,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {Search,X,Receipt,Phone} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appointmentApi } from '../src/services/api';
import { useSelector } from 'react-redux';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const {width,height} = Dimensions.get('window');

// Function to request permissions
// const requestPermissions = async () => {
//   if (Platform.OS === 'android') {
//     try {
//       if (Platform.Version >= 33) {
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//         ]);
//         return (
//           granted['android.permission.POST_NOTIFICATIONS'] ===
//             PermissionsAndroid.RESULTS.GRANTED
//         );
//       } else if (Platform.Version >= 30) {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } else {
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
//           PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
//         ]);
//         return (
//           granted['android.permission.READ_EXTERNAL_STORAGE'] ===
//             PermissionsAndroid.RESULTS.GRANTED &&
//           granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
//             PermissionsAndroid.RESULTS.GRANTED
//         );
//       }
//     } catch (err) {
//       // console.error('Error requesting permissions:', err);
//       return false;
//     }
//   }
//   return true;
// };


const AppointmentsScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchActive, setSearchActive] = useState(false);

  // Typing effect state

  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [, setSelectedTab] = useState('Appointments');
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleViewReceipt = (appointment) => {
    setSelectedAppointment(appointment);
    setReceiptModalVisible(true);
  };
  const searchLabels = useMemo(() => ['doctors', 'specialty'], []);
  useEffect(() => {
    if (isFocused) {
      setSelectedTab('Appointments');
    }

    setTimeout(() => {
      setLoading(false);
    }, 4000); // Simulated loading time
  }, [isFocused]);
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
                prevIndex => (prevIndex + 1) % searchLabels.length,
              );
              return prev;
            }
          });
        }, 100);
      }, 1500); // Delay before erasing starts
    }

    return () => {
      clearInterval(typingInterval);
      clearInterval(erasingInterval);
    };
  }, [isTyping, currentLabelIndex, searchLabels]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
const [pastAppointments, setPastAppointments] = useState([]);
const { patientId } = useSelector((state) => state.auth);

const fetchAppointments = useCallback(async () => {
  if (!patientId) {
    return;
  }

  try {
    const allAppointments = await appointmentApi.forPatient(patientId);
    const upcoming = [];
    const past = [];

    allAppointments.forEach((appointment) => {
      const { id, status, schedule, date } = appointment;
      const queueNumber = appointment.queueNumber ?? appointment.queue_number ?? appointment.queueNo ?? 'N/A';
      const specialization = schedule?.doctor?.specialization || schedule?.specialization || '';
      const doctorName = schedule?.doctor?.name || schedule?.doctorName || '';
      const clinicName = schedule?.clinicName || '';
      const fees = schedule?.fees ?? 0;
      const from = schedule?.from ?? schedule?.start_time ?? '';
      const to = schedule?.to ?? schedule?.end_time ?? '';
      const timeSlot = from && to ? `${from.slice(0,5)} - ${to.slice(0,5)}` : 'N/A';
      const appointmentDateObj = new Date(date);
      const formattedDate = `${String(appointmentDateObj.getDate()).padStart(2, '0')}-${String(appointmentDateObj.getMonth() + 1).padStart(2, '0')}-${appointmentDateObj.getFullYear()}`;

      const appointmentData = {
        id,
        doctorName,
        specialization,
        hospital: clinicName,
        queueNumber,
        image: require('../assets/user.png'),
        appointmentDate: formattedDate,
        timeSlot,
        fees,
        status,
      };

      if (status === 'waiting' || status === 'booked') {
        upcoming.push(appointmentData);
      } else if (status === 'completed' || status === 'cancelled' || status === 'skipped') {
        past.push(appointmentData);
      }
    });

    setUpcomingAppointments(upcoming);
    setPastAppointments(past);
  } catch (error) {
    console.error('Error fetching appointments:', error);
  } finally {
    setLoading(false);
  }
}, [patientId]);

// Fetch appointments when the screen is focused
useEffect(() => {
  if (isFocused) {
    setLoading(true);
    fetchAppointments();
  }
}, [isFocused, fetchAppointments]);

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Call +91 9876543210 to cancel your appointment. The cancellation will be confirmed after the call.',
      [
        {
          text: 'Call Now',
          onPress: () => Linking.openURL('tel:+918158094184'), // Opens the dialer
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const allAppointments = [...upcomingAppointments, ...pastAppointments];

  const handleSearch = text => {
    setSearchText(text);
    if (text.trim().length > 0) {
      setSearchActive(true);
      const filtered = allAppointments.filter(
        appointment =>
          appointment.doctorName.toLowerCase().includes(text.toLowerCase()) ||
          appointment.specialty.toLowerCase().includes(text.toLowerCase()) ||
          appointment.hospital.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredAppointments(filtered);
    } else {
      setSearchActive(false);
    }
  };


 // Updated Appointment Card to include Reschedule Message for Skipped Appointments
const renderAppointmentCard = (appointment, isPast = false) => (
  <View>
    <View key={appointment.id} style={styles.appointmentCard}>
      <Image source={appointment.image} style={styles.doctorImage} />
      <View style={styles.cardContent}>
        <View style={styles.cancel}>
          <View>
            <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
            <Text
              style={[
                styles.specialtyAndHospital,
                isPast && styles.pastSpecialtyAndHospital, // Conditional style for past appointments
              ]}
            >
              {appointment.specialization} • {appointment.hospital}
            </Text>
          </View>
          {!isPast && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAppointment}>
              <X color="#FF6347" size={18} />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={[
            styles.appointmentDateText,
            isPast && styles.pastAppointmentDateText, // Conditional style for past appointments
          ]}
        >
          Date: <Text style={styles.bold}>{appointment.appointmentDate}</Text>
        </Text>

        {appointment.status === 'cancelled' && (
          <Text style={styles.cancelledText}>Cancelled</Text>
        )}

        {!isPast && (
          <Text style={styles.queueText}>
            Your Queue Number: <Text style={styles.bold}>{appointment.queueNumber}</Text>
          </Text>
        )}

        {isPast && appointment.status === 'skipped' && (
          <Text style={styles.rescheduleMessage}>
            For reschedule or cancel, please contact the clinic.
          </Text>
        )}
      </View>

      {isPast && appointment.status === 'skipped' && (
        <Text style={styles.skippedText}>Skipped</Text>
      )}
    </View>

    {isPast && (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.viewReceiptButton,
            appointment.status === 'skipped' && styles.skippedReceiptButton, // Conditional style for skipped appointments
          ]}
          onPress={() => handleViewReceipt(appointment)}
        >

           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Receipt color="#1BBA8D" size={16} style={{ marginRight: 5 }} />
                      <Text style={styles.viewReceiptButtonText}>View Receipt</Text>
                    </View>
        </TouchableOpacity>

        {appointment.status === 'skipped' && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL('tel:+918158094184')} // Replace with the clinic's phone number
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Phone color="#164772" size={16} style={{ marginRight: 5 }} />
            <Text style={styles.callButtonText}>Call Clinic</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    )}

    {/* Divider Below Each Card */}
    <View style={styles.divider} />
  </View>
);

  if (loading) {
    return (
      <View style={styles.headtop}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />

        <View style={styles.head}>
          <ShimmerPlaceHolder style={styles.shimmerCard} />
        </View>
        <View>
          <ShimmerPlaceHolder style={styles.shimmerSearchBar} />
          <ShimmerPlaceHolder style={styles.shimmerCardUpcomingappointment} />
          <View style={styles.head2}>
            <ShimmerPlaceHolder style={styles.shimmerCard3} />
            <View style={styles.head3}>
              <ShimmerPlaceHolder style={styles.shimmerCard5} />
              <ShimmerPlaceHolder style={styles.shimmerCard4} />
              <ShimmerPlaceHolder style={styles.shimmerCard6} />
            </View>
          </View>

          <ShimmerPlaceHolder style={styles.shimmerCardpastappointmnet} />
          <View style={styles.head4}>
            <View style={styles.head2}>
              <ShimmerPlaceHolder style={styles.shimmerCard3} />
              <View style={styles.head3}>
                <ShimmerPlaceHolder style={styles.shimmerCard5} />
                <ShimmerPlaceHolder style={styles.shimmerCard4} />
                <ShimmerPlaceHolder style={styles.shimmerCard6} />
              </View>
            </View>

          </View>

          <View style={styles.head4}>
            <View style={styles.head2}>
              <ShimmerPlaceHolder style={styles.shimmerCard3} />
              <View style={styles.head3}>
                <ShimmerPlaceHolder style={styles.shimmerCard5} />
                <ShimmerPlaceHolder style={styles.shimmerCard4} />
                <ShimmerPlaceHolder style={styles.shimmerCard6} />
              </View>
            </View>

          </View>

          <View style={styles.head4}>
            <View style={styles.head2}>
              <ShimmerPlaceHolder style={styles.shimmerCard3} />
              <View style={styles.head3}>
                <ShimmerPlaceHolder style={styles.shimmerCard5} />
                <ShimmerPlaceHolder style={styles.shimmerCard4} />
                <ShimmerPlaceHolder style={styles.shimmerCard6} />
              </View>
            </View>

          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Appointments</Text>
        </View>

        <View style={styles.searchBarContainer}>
          <Search color="#000" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${currentPlaceholder}`}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        <ScrollView style={styles.scrollView}>
          {!searchActive ? (
            <>
              <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => renderAppointmentCard(appointment, false))
              ) : (
                <Text style={styles.noResultsText}>No upcoming appointments.</Text>
              )}

              <Text style={styles.sectionTitle}>Past Appointment</Text>
              {pastAppointments.length > 0 ? (
                pastAppointments.map(appointment => renderAppointmentCard(appointment, true))
              ) : (
                <Text style={styles.noResultsText}>No past appointments.</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(appointment => (
                  <View key={appointment.id}>
                    {renderAppointmentCard(appointment, pastAppointments.includes(appointment))}
                  </View>
                ))
              ) : (
                <Text style={styles.noResultsText}>No appointments found.</Text>
              )}
            </>
          )}
        </ScrollView>
        <Modal
          visible={receiptModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setReceiptModalVisible(false)}
        >
          <Pressable style={styles.RemodalOverlay} onPress={() => setReceiptModalVisible(false)}>
            <Pressable style={styles.receiptModal}>
              <View style={styles.RemodalHeader}>
                <Text style={styles.RemodalTitle}>Appointment Receipt</Text>
                <TouchableOpacity onPress={() => setReceiptModalVisible(false)}>
                  <Text style={styles.RecloseModal}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.receiptContent}>
                {selectedAppointment ? (
                  <>
                    <Text style={styles.receiptLabel}>Doctor:</Text>
                    <Text style={styles.receiptText}>Dr. {selectedAppointment.doctorName}</Text>

                    <Text style={styles.receiptLabel}>Specialization:</Text>
                    <Text style={styles.receiptText}>{selectedAppointment.specialization}</Text>

                    <Text style={styles.receiptLabel}>Clinic:</Text>
                    <Text style={styles.receiptText}>{selectedAppointment.hospital}</Text>

                    <Text style={styles.receiptLabel}>Date:</Text>
                    <Text style={styles.receiptText}>{selectedAppointment.appointmentDate}</Text>

                    <Text style={styles.receiptLabel}>Queue Number:</Text>
                    <Text style={styles.receiptText}>{selectedAppointment.queueNumber}</Text>

                    <Text style={styles.receiptLabel}>Status:</Text>
                    <Text style={styles.receiptText}>{selectedAppointment.status}</Text>

                    <Text style={styles.receiptLabel}>Time Slot:</Text>
                    <Text style={styles.receiptText}>{selectedAppointment.timeSlot}</Text>

                    <Text style={styles.receiptLabel}>Fees Paid:</Text>
                    <Text style={styles.receiptText}>₹{selectedAppointment.fees}</Text>
                  </>
                ) : (
                  <Text style={styles.receiptText}>No receipt available</Text>
                )}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
};



export default AppointmentsScreen;

const styles = StyleSheet.create({
  headtop: {backgroundColor: '#fff', paddingHorizontal: 0.04 * width},
  head: {
    height: 0.2 * width,
  },
  head2: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    marginBottom: 0.025 * width,
    marginTop: 0.05 * width,
  },
  head3: {
    flexDirection: 'column',
    marginTop: 0.0125 * width,
    right:0.045 * width,
    marginVertical: 0.005 * width,

  },
  head4: {
    flexDirection: 'column',

    alignContent: 'center',
    justifyContent: 'center',
  },
  shimmerCardUpcomingappointment: {
    width: '55%',
    height: 0.0625 * width,
    marginTop: 0.05 * width,
    borderRadius: 0.025 * width,
  },
  shimmerCardpastappointmnet: {
    width: '45%',
    height: 0.0625 * width,
    marginTop: 0.05 * width,
    borderRadius: 0.025 * width,
  },
  shimmerCard4: {
    width: '117%',
    height: 0.0375 * width,
    marginTop: 0.005 * width,
    borderRadius: 0.025 * width,

    marginBottom: 0.0125 * width,

  },
  shimmerCard5: {
    width: '77%',
    height: 0.05 * width,
    marginBottom: 0.0125 * width,
    borderRadius: 0.025 * width,

  },
  shimmerCard6: {
    width: '97%',
    height: 0.04 * width,
    marginBottom: 0.0125 * width,
    borderRadius: 0.025 * width,

  },
  shimmerCard3: {
    width: 75,
    height: 75,
    borderRadius: 75,
    right: 0.0575 * width,
  },
  shimmerHeader: {
    width: '80%',
    height: 20,
    marginBottom: 0.05 * width,
    borderRadius: 10,
  },
  shimmerSearchBar: {
    width: '100%',
    height: 40,
    marginBottom: 0.05 * width,
    borderRadius: 10,
  },


  shimmerCard: {
    width: '45%',
    height: 30,
    marginTop: 0.05 * width,
    borderRadius: 0.025 * width,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#164772',
    padding: 0.05 * width,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 0.04 * width,
    borderRadius: 10,
    paddingHorizontal: 0.025 * width,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0.025 * width,
    marginLeft: 8,
  },
  scrollView: {
    paddingHorizontal: 0.04 * width,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#164772',
    marginVertical: 0.025 * width,
  },

  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 0.025 * width,
    marginBottom: 0.025 * width,
    paddingBottom: 0.025 * width,
    marginTop: 0.0375 * width,
  },

  doctorImage: {
    width: 0.17 * width,
    height: 0.17 * width,
    borderRadius: 0.25 * width,
    marginRight: width * 0.02,
  },
  cardContent: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  specialtyAndHospital: {
    fontSize: 12,
    color: '#555',
    marginVertical: 0, // Default margin for upcoming appointments
  },

  pastSpecialtyAndHospital: {
    marginVertical: height * 0.0055, // No margin for past appointments
  },

  appointmentDateText: {
    fontSize: 12,
    color: '#164772',
    fontWeight: 'bold',
    marginVertical: height * 0.005,
  },

  pastAppointmentDateText: {
    marginVertical: height * 0.0058, // Reduced margin for past appointments
  },
  appointmentTime: {
    fontSize: 12,
  },
  upcomingAppointmentTime: {
    color: '#1BBA8D', // Green for upcoming appointments
    fontWeight: 'bold',
  },
  pastAppointmentTime: {
    color: 'black', // Red for past appointments
  },
  divider: {
    height: 0.7,
    backgroundColor: '#16477220',
    marginTop:height * 0.01,
  },

  noResultsText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 0.05 * width,
  },
  cancel:{
    flex:1,
    flexDirection:'row',
    justifyContent:'space-between',
  },
  cancelButton: {
  borderColor: '#FF6347',
  borderWidth: width * 0.001,
  padding: width * 0.005,
  width: width * 0.07,
  height: width * 0.07,
  borderRadius: width * 0.5,
  alignItems: 'center',
  justifyContent: 'center',
 },

  cancelButtonText: {
    fontWeight: 'bold',
    textAlign:'center',
  },
  queueInfo:{
    color:'#1BBA8D',
    fontWeight:'500',
    fontSize:12,
  },
  queueText:{
    fontSize: 12,
    color: '#444',
    marginBottom:height * 0.005,
  },
  cancelledText: {
    position: 'absolute',
    top: height * 0,
    right: 0,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6347', // Orange color for skipped
  },
  rescheduleMessage:{
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6347', // Red color for cancelled appointments
    marginTop: height * 0.003,
  },
  skippedText: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFA500', // Orange color for skipped
  },
  buttonContainer: {
     flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.0,

  },

  viewReceiptButton: {
    borderWidth: width * 0.001,
    borderColor: '#1BBA8D',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take up equal space
    marginRight: width * 0.01, // Add some spacing between buttons
    backgroundColor:'#ffffff',
    marginTop: height * 0.0,
  },

  skippedReceiptButton: {
    borderColor: '#1BBA8D', // Orange border for skipped appointments
  },

  viewReceiptButtonText: {
    color: '#1BBA8D', // Default text color
    fontSize: 12,
    fontWeight: '600',
  },

  callButton: {
    borderWidth: width * 0.001,
    borderColor: '#164772',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take up equal space
    marginRight: width * 0.01, // Add some spacing between buttons
    backgroundColor:'#ffffff',
    marginTop: height * 0.0,

  },

  callButtonText: {
    color: '#164772', // Orange text for call button
    fontSize: 12,
    fontWeight: '600',
  },
  RemodalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  receiptModal: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: width * 0.03,
    padding: width * 0.04,
    elevation: 5,
  },

  RemodalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.007,
  },

  RemodalTitle: {
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
    marginBottom: height * 0.009,
  },
});
