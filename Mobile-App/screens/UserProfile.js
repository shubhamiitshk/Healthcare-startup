import React, { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Pressable,
  StatusBar,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setPhoneNumber, setPatientId, clearAuth } from '../src/store/authSlice';
import { ArrowLeft, ChevronDown, LogOut, Calendar } from 'lucide-react-native';
import { patientApi } from '../src/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

const items = [
  { label: 'Male',   value: 'male'   },
  { label: 'Female', value: 'female' },
  { label: 'Other',  value: 'other'  },
];

const CustomPicker = ({ selectedValue, onValueChange, items: pickerItems }) => {
  const [isOpen, setIsOpen]           = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const dropdownAnim                  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const found = pickerItems.find(i => i.value === selectedValue);
    setSelectedLabel(found ? found.label : 'Select Gender');
  }, [selectedValue, pickerItems]);

  const toggle = () => {
    Animated.timing(dropdownAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 100,
      useNativeDriver: true,
    }).start(() => setIsOpen(!isOpen));
  };

  return (
    <View style={styles.customPickerContainer}>
      <Pressable onPress={toggle} style={styles.customPicker}>
        <Text style={styles.customPickerText}>{selectedLabel}</Text>
        <ChevronDown size={20} color="#333" />
      </Pressable>
      {isOpen && (
        <Animated.View
          style={[
            styles.dropdown,
            { transform: [{ scaleY: dropdownAnim }] },
          ]}
        >
          {pickerItems.map(item => (
            <Pressable
              key={item.value}
              onPress={() => {
                onValueChange(item.value);
                toggle();
              }}
              style={[
                styles.dropdownItem,
                item.value === selectedValue && styles.selectedDropdownItem,
              ]}
            >
              <Text style={styles.dropdownItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const UserProfile = ({ navigation }) => {
  const dispatch    = useDispatch();
  const authToken   = useSelector(s => s.auth.authToken);
  const phoneNumber = useSelector(s => s.auth.phoneNumber);
  const [selectedImage] = useState(null);
  const [profileImage, setProfileImage] = useState(require('../assets/profile.png'));
  const [name, setName]                 = useState('');
  const [gender, setGender]             = useState('');
  const [dob, setDob]                   = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [, setHasChanges]     = useState(false);
  const [, setIsEditing]       = useState(false);

  useEffect(() => {
    if (!authToken || !phoneNumber) {return;}
    setLoading(true);

    patientApi.searchByPhone(phoneNumber)
      .then((data) => {
        const {
          id,
          fullName,
          gender: fetchedGender,
          dob: fetchedDob,
          profile_image_url,
          phone_number,
        } = data;

        dispatch(setPatientId(id));
        dispatch(setPhoneNumber(phone_number));
        setName(fullName    || '');
        setGender(fetchedGender || '');
        setDob(
          fetchedDob
            ? new Date(fetchedDob).toLocaleDateString('en-GB')
            : ''
        );
        if (profile_image_url) {
          setProfileImage({ uri: profile_image_url });
        }
      })
      .catch(() => {
        Alert.alert(
          'Error',
          'Failed to fetch profile data. Please relogin.',
          [{
            text: 'Relogin',
            onPress: () => {
              dispatch(clearAuth());
              navigation.replace('RegisterScreen');
            },
          }]
        );
      })
      .finally(() => setLoading(false));
  }, [authToken, phoneNumber, dispatch, navigation]);

  const handleLogout = () => {
    dispatch(clearAuth());
    navigation.replace('RegisterScreen');
  };

  const handleOutsidePress = () => {
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.container2}>
        <StatusBar backgroundColor="#E6E6E6" barStyle="dark-content" />
        <ShimmerPlaceHolder style={styles.profilePictureShimmer} />
        <ShimmerPlaceHolder style={styles.profilePictureShimmer2} />
        <ShimmerPlaceHolder style={styles.ContactNumberstyle} />
        <ShimmerPlaceHolder style={styles.nameShimmer} />
        <View style={styles.infoRow}>
          <ShimmerPlaceHolder style={styles.infoRowdetail} />
          <ShimmerPlaceHolder style={styles.infoRowdetail} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.container}>
          <StatusBar backgroundColor="#E3E9EE" barStyle="dark-content" />
          <View contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backIcon}>
                <ArrowLeft color="#000" size={24} />
              </Pressable>
              <Text style={styles.headerText}>My Profile</Text>
            </View>
            <View style={styles.profileContainer}>
              <View style={styles.imageWrapper}>
                <View style={styles.profileImageBorder}>
                  <Image source={selectedImage || profileImage} style={styles.profileImage} />
                </View>
              </View>
              <Text style={styles.contact}>{phoneNumber ? phoneNumber : 'Fetching...'}</Text>
            </View>
            <View style={styles.userInfoContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(newName) => {
                    setName(newName);
                    setHasChanges(true);
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  onFocus={() => setIsEditing(true)}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={styles.inputContainer2}>
                  <Text style={styles.label2}>Gender</Text>
                  <CustomPicker
                    selectedValue={gender}
                    onValueChange={(value) => {
                      setGender(value);
                      setHasChanges(true);
                    }}
                    items={items}
                  />
                </View>
                <View style={styles.inputContainer2}>
                  <Text style={styles.label2}>DOB</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{ flex: 1, height: height * 0.06 }}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={dob}
                        placeholder="Enter your DOB"
                        placeholderTextColor="#999"
                        editable={false}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <Calendar color="#333" size={20} style={{ marginLeft: -30 }} />
                    </TouchableOpacity>
                  </View>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dob ? new Date(dob.split('/').reverse().join('-')) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        if (event.type === 'set') {
                          setDob(selectedDate.toLocaleDateString('en-GB'));
                          setHasChanges(true);
                        }
                        setShowDatePicker(false);
                      }}
                    />
                  )}
                </View>
                <View />
              </View>
              <View style={styles.inputandImagegap}>
                <Image
                  source={require('../assets/UserProfileImage.png')}
                  style={styles.userProfileImage}
                />
              </View>
            </View>
          </View>
          {/* Logout Button at the Bottom */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
            <LogOut color="#FF3B30" size={20} style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  container2: {
    alignItems: 'center',
    backgroundColor: '#fff',
    height: height, // Responsive height
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
  scrollContainer: {
    paddingBottom: height * 0.05000,
  },
  header: {
    flexDirection: 'row',
    paddingVertical: height * 0.01200,
    alignItems: 'flex-start',
    height: height * 0.20000,
    backgroundColor: '#E3E9EE',
  },
  backIcon: {
    paddingLeft: width * 0.05000,
    paddingVertical: height * 0.02000,
  },
  headerText: {
    fontSize: 16, // Constant font size
    fontWeight: 'bold',
    color: '#000',
    paddingLeft: width * 0.03000,
    paddingVertical: height * 0.02000,
  },
  contact: {
    fontSize: 14, // Constant font size
    marginTop: -height * 0.01200,
    fontWeight: 'bold',
    color: '#000',
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: -height * 0.11000,
    paddingHorizontal: width * 0.04000,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImageBorder: {
    width: width * 0.40000,
    height: width * 0.40000,
    borderRadius: width * 0.19500,
    borderWidth: width * 0.06000,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.08000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30000,
    shadowRadius: width * 0.01000,
  },
  profileImage: {
    width: width * 0.30000,
    height: width * 0.30000,
    borderRadius: width * 0.15000,
  },
  editIcon: {
    position: 'absolute',
    bottom: height * 0.02000,
    right: width * 0.06000,
    backgroundColor: '#1BBA8D',
    borderRadius: width * 0.05000,
    padding: width * 0.01500,
    elevation: 5,
  },
  userInfoContainer: {
    marginTop: height * 0.02000,
    paddingHorizontal: width * 0.05000,
  },
  inputContainer: {
    marginBottom: height * 0.02000,
    height: height * 0.07000,
    width: width * 0.9000,
  },
  inputContainer2: {
    marginBottom: height * 0.02000,
    height: height * 0.07000,
    width: width * 0.44000,
  },
  label: {
    width: width * 0.15000,
    fontSize: 12, // Constant font size
    color: '#00000060',
    backgroundColor: '#fff',
    fontWeight: '800',
    marginLeft: width * 0.03000,
    marginBottom: height * -0.01100,
    zIndex: 1,
    textAlign: 'center',
  },
  label2: {
    width: width * 0.15000,
    marginLeft: width * 0.02000,
    fontSize: 12, // Constant font size
    color: '#00000060',
    backgroundColor: '#fff',
    fontWeight: '800',
    marginBottom: height * -0.01100,
    zIndex: 20,
    textAlign: 'center',
  },
  input: {
    height: height * 0.06000,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: width * 0.02500,
    paddingHorizontal: width * 0.05000,
    fontSize: 14, // Constant font size
    color: '#333',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: height * 0.00100 },
    shadowOpacity: 0.10000,
    shadowRadius: width * 0.02000,
    paddingVertical: height * 0.01000,
  },
  customPickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: width * 0.025,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    zIndex: 10,
  },
  customPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    height: height * 0.06,
  },
  customPickerText: { fontSize: 14, color: '#333' },
  dropdown: {
    marginTop: 7,
    transformOrigin: 'top',
    position: 'absolute',
    top: height * 0.061,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: width * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2.5,
  },
  dropdownItem: { padding: width * 0.02 },
  dropdownItemText: { fontSize: 14, color: '#333' },
  selectedDropdownItem: {
    backgroundColor: '#E3E9EE70',
    borderRadius: width * 0.02,
    margin: width * 0.01,
  },
  inputandImagegap: {
    marginTop: height * 0.08,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#164772',
    padding: width * 0.03000,
    borderRadius: width * 0.02500,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: width * 0.07000,
    marginTop: width * 0.06000,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16, // Constant font size
    fontWeight: 500,
    marginLeft: width * 0.02000,
  },
  userProfileImage: {
    width: width * 0.53333,
    height: height * 0.26667, // 200 as a fraction of screen height (200 / 750 for a typical base height)
    marginHorizontal: width * 0.2, // 60 as a fraction of screen width (60 / 375)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    position: 'absolute',
    bottom: height * 0.02,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: '#ffffff', // Red color for logout button
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor:'#FF3B30',
    borderWidth:width * 0.0015,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
