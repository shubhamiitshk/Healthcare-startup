import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronDown, CalendarDays } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setPatientId } from '../src/store/authSlice';
import { patientApi } from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ route, navigation }) => {
  const { patientId } = route.params; // Get patientId from route params
  const [name, setName] = useState(''); // Name input state
  const [gender, setGender] = useState(''); // Gender input state
  const [dob, setDob] = useState(''); // Date of birth input state
  const [showDatePicker, setShowDatePicker] = useState(false); // Controls date picker visibility
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Tracks keyboard visibility
  const [loading, setLoading] = useState(false); // Loading state for profile submission
  const dispatch = useDispatch(); // Redux dispatch function

  // If patientId is not in route params, fall back to Redux store
  const reduxPatientId = useSelector((state) => state.auth.patientId);
  const finalPatientId = patientId || reduxPatientId;

  useEffect(() => {
    if (!finalPatientId) {
      // .log('Patient ID is missing in ProfileScreen');console
      return;
    }
    // console.log('ProfileScreen mounted with patientId:', finalPatientId);
  }, [finalPatientId]);
  // Handle keyboard visibility changes
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle date picker change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    if (currentDate && !isNaN(currentDate)) {
      const formattedDate = currentDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
      setDob(formattedDate);
    }
  };
  // console.log('ProfileScreen mounted with patientId:', patientId);
  const handleProfileSubmit = async () => {
    if (!name || !gender || !dob) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (patientId) {
        await patientApi.update(patientId, { fullName: name, gender, dob });
      } else {
        const result = await patientApi.create({
          phone_number: route.params.phoneNumber,
          fullName: name,
          gender,
          dob,
        });
        if (result?.patientId) {
          dispatch(setPatientId(result.patientId));
        }
      }
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred while updating the profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
        </View>

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.inputHeight]}
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Gender and DOB Fields */}
          <View style={styles.rowContainer}>
            {/* Gender Picker */}
            <View style={styles.equalHalfContainer}>
              <Text style={styles.label}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.pickerWrapper, styles.inputHeight]}>
                <Picker
                  selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                  style={[styles.picker, styles.inputHeight, { color: gender ? '#000' : '#7D7D7D' }]}
                  dropdownIconColor="white"
                  mode="dialog"
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
                <ChevronDown size={20} color="#000" style={styles.chevronIcon} />
              </View>
            </View>

            {/* DOB Picker */}
            <View style={styles.equalHalfContainer}>
              <Text style={styles.label}>
                DOB <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.input, styles.inputHeight, styles.dobContainer]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: dob ? '#000' : '#7D7D7D' }}>
                  {dob || 'YYYY-MM-DD'}
                </Text>
                <CalendarDays size={16} color={dob ? '#000' : '#7D7D7D'} style={styles.dobIcon} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.buttonContainer, isKeyboardVisible && styles.buttonContainerKeyboardVisible]}>
          <TouchableOpacity
            style={[styles.button, (!name || !gender || !dob) && styles.buttonDisabled]}
            onPress={handleProfileSubmit}
            disabled={!name || !gender || !dob || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Finish</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: width * 0.06,
    paddingBottom: width * 0.03,
    paddingHorizontal: width * 0.05,
    borderBottomWidth: 0.8,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: '#164772',
    marginLeft: width * 0.02,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingBottom: width * 0.15,
    paddingTop: width * 0.06,
  },
  inputContainer: {
    marginBottom: width * 0.05,
  },
  label: {
    fontSize: width * 0.035,
    fontWeight: '500',
    color: '#000',
    marginBottom: width * 0.02,
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: width * 0.02,
    padding: width * 0.03,
    backgroundColor: '#fff',
    color: '#000',
  },
  inputHeight: {
    height: 55,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: width * 0.05,
  },
  equalHalfContainer: {
    flex: 1,
    marginHorizontal: width * 0.01,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderRadius: width * 0.02,
    position: 'relative',
  },
  picker: {
    width: '100%',
    color: '#000',
  },
  chevronIcon: {
    position: 'absolute',
    right: width * 0.03,
    top: '50%',
    transform: [{ translateY: -5 }],
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dobIcon: {
    marginLeft: width * 0.03,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: width * 0.03,
    position: 'absolute',
    bottom: 10,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  buttonContainerKeyboardVisible: {
    bottom: width * 0.02,
  },
  button: {
    backgroundColor: '#164772',
    paddingVertical: width * 0.028,
    borderRadius: width * 0.038,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B3B3B3',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
