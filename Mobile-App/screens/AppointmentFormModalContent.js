// src/screens/AppointmentFormModalContent.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { patientApi, appointmentApi } from '../src/services/api';
import { clearAuth } from '../src/store/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const AppointmentFormModalContent = ({
  doctor,
  selectedDate,
  selectedSlot,
  onClose,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // pull patientId/authToken from Redux
  const { patientId, authToken, phoneNumber } = useSelector((s) => s.auth);

  // state for loaded patient
  const [patientDetails, setPatientDetails] = useState({
       fullName:     '',
       gender:       '',
       dob:          '',
       familyMembers: [],
     });
  const [loadingPatient, setLoadingPatient] = useState(true);

  // family‐member UI state
  const [isNewMember, setIsNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberGender, setNewMemberGender] = useState('');
  const [newMemberDOB, setNewMemberDOB] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // which patient is booking
  const [selectedMember, setSelectedMember] = useState('self');

  // loader for submit
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(() => {
    dispatch(clearAuth());
    navigation.replace('RegisterScreen');
  }, [dispatch, navigation]);

  useEffect(() => {
    if (!phoneNumber) {return;}
    setLoadingPatient(true);

    patientApi
      .searchByPhone(phoneNumber)
      .then(setPatientDetails)
      .catch((e) => {
        if (e.status === 401) {
          Alert.alert('Session expired', 'Please log in again.');
          handleLogout();
        } else {
          Alert.alert(
            'Error',
            'Could not load patient profile — check your connection.'
          );
        }
      })
      .finally(() => setLoadingPatient(false));
  }, [phoneNumber, authToken, handleLogout]);


  // helper to compute age from ISO dob
  const getAge = (dob) => {
    if (!dob) {return '';}
    const birth = new Date(dob);
    const diff = new Date().getFullYear() - birth.getFullYear();
    return diff;
  };

  const handlePayPress = async () => {
    if (!selectedDate || !selectedSlot) {
      return Alert.alert('Invalid selection', 'Please choose a date & slot');
    }
    setLoading(true);

    const payload = {
      scheduleId: selectedSlot.id,
      date: selectedDate,
      source: 'mobile',
      ...(selectedMember === 'self'
        ? { patientId }
        : { familyMemberId: selectedMember }),
      ...(isNewMember && {
        newMember: {
          name:     newMemberName,
          gender:   newMemberGender,
          dob:      newMemberDOB,
          relation: newMemberRelation,
        },
      }),
    };

    try {
      const booked = await appointmentApi.book(payload);
      const member = selectedMember === 'self'
        ? patientDetails
        : patientDetails.familyMembers.find((m) => m.id === selectedMember);

      const receipt = {
        doctorName:     doctor.name,
        specialization: doctor.specialization,
        patientName:    member?.name,
        gender:         member?.gender,
        dob:            member?.dob,
        relation:       selectedMember === 'self' ? 'Self' : member?.relation,
        date:           booked.date,
        timeSlot:       `${booked.schedule.from} - ${booked.schedule.to}`,
        clinicName:     booked.schedule.clinicName,
        clinicAddress:  booked.schedule.clinicAddress,
        fees:           booked.schedule.fees,
        queueNumber:    booked.queueNumber,
      };

      Alert.alert('Booked!', 'Your appointment was successful.');
      setLoading(false);
      onClose();
      navigation.navigate('AppointmentReceipt', receipt);
    } catch (e) {
      console.error('Booking payload:', payload);
      setLoading(false);
      const raw = e.message;
      const msg = Array.isArray(raw) ? raw.join('\n') : raw;
      Alert.alert('Failed', msg);
    }
  };

  const addNewFamilyMember = async () => {
    if (
      !newMemberName ||
      !newMemberGender ||
      !newMemberDOB ||
      !newMemberRelation
    ) {
      Alert.alert('Missing fields', 'Please fill all member details');
      return;
    }
    try {
      await patientApi.addFamilyMember(patientId, {
        name: newMemberName,
        gender: newMemberGender,
        dob: newMemberDOB,
        relation: newMemberRelation,
        source: 'mobile',
      });
      Alert.alert('Added', 'Family member added!');
      const refreshed = await patientApi.searchByPhone(phoneNumber);
      setPatientDetails(refreshed);
      setIsNewMember(false);
      setNewMemberName('');
      setNewMemberGender('');
      setNewMemberDOB('');
      setNewMemberRelation('');
    } catch (e) {
      console.error(e);
      Alert.alert('Failed', e.message || 'Could not add member');
    }
  };

  // 4️⃣ DOB picker for new member
  const onDateChange = (_, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {setNewMemberDOB(date.toISOString().split('T')[0]);}
  };

// at the top of your return:
if (loadingPatient) {
  return (
    <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator size="large" color="#164772" />
    </SafeAreaView>
  );
}


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 📅 Confirmed date/slot */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTimeText}>Date: {selectedDate}</Text>
            <Text style={styles.dateTimeText}>
              Time: {selectedSlot.from} - {selectedSlot.to}
            </Text>
          </View>

          <Text style={styles.heading}>
            {isNewMember ? 'Add a Member' : 'Select a Member'}
          </Text>

          {loadingPatient ? (
            <ActivityIndicator size="small" color="#164772" />
          ) : (
            <>
              {!isNewMember ? (
                <View style={styles.memberList}>
                  {/* Self */}
                  <TouchableOpacity
                    style={[
                      styles.memberItem,
                      selectedMember === 'self' && styles.selectedMemberItem,
                    ]}
                    onPress={() => setSelectedMember('self')}
                  >
                    <View style={styles.memberInitialContainer}>
                      <Text style={styles.memberInitial}>
                        {patientDetails?.fullName?.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>
                        {patientDetails.fullName}
                      </Text>
                      <Text style={styles.memberInfo}>
                        Self | {patientDetails.gender} |{' '}
                        {getAge(patientDetails.dob)} yrs
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Family */}
                  {patientDetails.familyMembers?.length > 0 &&
                    patientDetails.familyMembers.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.memberItem,
                          selectedMember === m.id && styles.selectedMemberItem,
                        ]}
                        onPress={() => setSelectedMember(m.id)}
                      >
                        <View style={styles.memberInitialContainer}>
                          <Text style={styles.memberInitial}>
                            {m.name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberInfo}>
                            {m.relation} | {m.gender} | {getAge(m.dob)} yrs
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              ) : (
                // Add Member form
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                  />
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={newMemberGender}
                      onValueChange={setNewMemberGender}
                    >
                      <Picker.Item label="Select Gender" value="" />
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={[styles.input, styles.dobContainer]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text
                      style={{
                        color: newMemberDOB ? '#000' : '#7D7D7D',
                      }}
                    >
                      {newMemberDOB || 'DOB'}
                    </Text>
                    <CalendarDays
                      size={16}
                      color={newMemberDOB ? '#000' : '#7D7D7D'}
                    />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={newMemberDOB ? new Date(newMemberDOB) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="Relation"
                    value={newMemberRelation}
                    onChangeText={setNewMemberRelation}
                  />
                  <Pressable
                    style={styles.submitButton}
                    onPress={addNewFamilyMember}
                  >
                    <Text style={styles.submitButtonText}>
                      Add Family Member
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={() => setIsNewMember((v) => !v)}
            style={{ marginTop: 10 }}
          >
            <Text style={styles.addMemberText}>
              {isNewMember ? 'Use my details' : 'Add a member'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 📦 Book Now Button */}
        {!isNewMember && (
          <View style={styles.payButtonContainer}>
            <Pressable
              style={styles.payButton}
              onPress={handlePayPress}
              disabled={loading || !selectedMember}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Book Now</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};



// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width * 0.03,
    borderTopLeftRadius: width * 0.01,
    borderTopRightRadius: width * 0.1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  dateTimeContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#164772',
  },
  memberList: {
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedMemberItem: {
    backgroundColor: '#16477220', // Highlight selected member
  },
  memberInitialContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16477210',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#164772',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  memberInfo: {
    fontSize: 14,
    color: '#555',
  },
  divider: {
    height: 0,
    backgroundColor: '#ddd',
    marginVertical: 0,
  },
  addMemberText: {
    color: '#1BBA8D',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  form: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },

  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: 5,
    marginBottom: 10,
  },
  dobIcon: {
    marginRight: 6,
  },
  submitButton: {
    backgroundColor: '#1BBA8D',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  payButtonContainer: {
    justifyContent: 'flex-end',
  },
  payButton: {
    backgroundColor: '#164772',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AppointmentFormModalContent;
