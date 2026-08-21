import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  Keyboard,
  Animated,
  Pressable,
  Easing,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth'; // Firebase Authentication
import { useDispatch, useSelector } from 'react-redux'; // Redux hooks
import { setPhoneNumber } from '../src/store/authSlice'; // Redux action
import { useNavigation } from '@react-navigation/native'; // Navigation hook
import { SafeAreaView } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');

const RegisterScreen = () => {
  const [phoneNumber, setPhoneNumberInput] = useState('+91 '); // Phone number input state
  const [loading, setLoading] = useState(false); // Loading state for OTP sending
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Tracks keyboard visibility
  const [isFocused, setIsFocused] = useState(false); // Tracks input focus
  const imageHeight = useState(new Animated.Value(width * 0.7))[0]; // Animated value for image height
  const dispatch = useDispatch(); // Redux dispatch function
  const navigation = useNavigation(); // Navigation object
  const isLoggedIn = useSelector((state) => !!state.auth.authToken); // Check if user is logged in

  // Redirect to MainTabs if user is already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigation.replace('MainTabs'); // Navigate to the main app
    }
  }, [isLoggedIn, navigation]);

  // Handle keyboard visibility changes
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      Animated.timing(imageHeight, {
        toValue: width * 0.35, // Reduce image height when keyboard is visible
        duration: 300,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      Animated.timing(imageHeight, {
        toValue: width * 0.7, // Restore image height when keyboard is hidden
        duration: 300,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }).start();
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [imageHeight]);

  // Handle phone number input change
  const handlePhoneNumberChange = (input) => {
    if (!input.startsWith('+91 ')) {
      input = '+91 ';
    }
    setPhoneNumberInput(input);
  };

  // Handle OTP sending
  const sendOTP = async () => {
    if (phoneNumber.length < 14) {
      Alert.alert('Invalid phone number', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);

      // Send OTP using Firebase
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setLoading(false);

      // Update Redux state with phone number
      dispatch(setPhoneNumber(phoneNumber));

      // Navigate to OTPScreen with confirmation object and phone number
      navigation.navigate('OTPScreen', { confirm: confirmation, phoneNumber });
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      // console.error('OTP Error:', error); // Log the error for debugging
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Animated.Image
          source={require('../assets/n1.png')}
          style={[styles.image, { height: imageHeight }]}
        />

        <View style={styles.headingContainer}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>
            Please enter your number to continue your registration
          </Text>
        </View>
        <View style={styles.phoneInputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputField, isFocused && styles.inputFieldFocused]}>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              maxLength={14}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>
        </View>
        <View style={styles.spacer} />
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        style={[styles.buttonContainer, isKeyboardVisible && styles.buttonContainerKeyboardVisible]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.button,
            phoneNumber.length < 14 && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={sendOTP}
          disabled={phoneNumber.length < 14 || loading}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
        </Pressable>
      </KeyboardAvoidingView>

      {!isKeyboardVisible && (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            By signing up or logging in, I accept the app's{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
      )}

      {loading && (
        <Modal transparent={true} animationType="fade">
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2E5BFF" />
            <Text style={styles.loaderText}>Processing...</Text>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: width * 0.05 },
  image: { width: width * 2, resizeMode: 'contain', marginTop: width * 0.1 },
  headingContainer: { width: '100%', marginTop: width * 0.05 },
  title: { fontSize: 20, fontWeight: '700', color: '#164772', textAlign: 'left', paddingLeft: width * 0.02 },
  subtitle: { fontSize: 16, fontWeight: '400', color: '#00000070', textAlign: 'left', paddingLeft: width * 0.02 },
  phoneInputContainer: { width: '100%', marginTop: width * 0.05, paddingHorizontal: width * 0.02 },
  label: { fontSize: width * 0.035, color: '#7D7D7D', marginBottom: width * 0.02 },
  inputField: { paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D1D1', borderRadius: width * 0.02 },
  inputFieldFocused: { borderColor: '#1BBA8D', borderWidth: 1.1 },
  input: { flex: 1, fontSize: width * 0.045, color: '#000000' },
  spacer: { flexGrow: 1 },
  buttonContainer: { position: 'absolute', bottom: width * 0.10, width: '100%', alignItems: 'center' },
  buttonContainerKeyboardVisible: { bottom: width * 0.04 },
  button: { backgroundColor: '#164772', paddingVertical: width * 0.028, borderRadius: width * 0.038, alignItems: 'center', justifyContent: 'center', width: '90%' },
  buttonDisabled: { backgroundColor: '#16477230' },
  buttonPressed: { backgroundColor: '#123456' },
  buttonText: { color: '#FFFFFF', fontSize: width * 0.038, fontWeight: 'bold' },
  footerContainer: { position: 'absolute', bottom: width * 0.005, width: '100%', alignItems: 'center' },
  footerText: { fontSize: width * 0.03, textAlign: 'center', color: '#7D7D7D', lineHeight: width * 0.04 },
  linkText: { color: '#2E5BFF', fontWeight: 'bold' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  loaderText: { color: '#FFFFFF', marginTop: width * 0.02, fontSize: width * 0.035 },
});

export default RegisterScreen;
