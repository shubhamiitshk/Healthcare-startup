import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { setAuthToken, setPatientId } from '../src/store/authSlice';
import { patientApi } from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const OTPScreen = ({ route, navigation }) => {
  const { confirm, phoneNumber } = route.params; // Get confirmation object and phone number from route params
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // OTP input state
  const inputs = useRef([]); // Ref for OTP input fields
  const [countdown, setCountdown] = useState(59); // Countdown timer for OTP resend
  const [isCounting, setIsCounting] = useState(true); // Controls the countdown timer
  const [loading, setLoading] = useState(false); // Loading state for OTP verification
  const [, setKeyboardVisible] = useState(false); // Tracks keyboard visibility
  const imageHeight = useState(new Animated.Value(width * 0.5))[0]; // Animated value for image height
  const dispatch = useDispatch(); // Redux dispatch function

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
        toValue: width * 0.5, // Restore image height when keyboard is hidden
        duration: 300,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [imageHeight]);

  // Handle OTP resend countdown
  useEffect(() => {
    let timer;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }

    return () => clearInterval(timer);
  }, [countdown, isCounting]);

  // Handle OTP input change
  const handleChange = (text, index) => {
    setOtp((prevOtp) => {
      const newOtp = [...prevOtp];
      newOtp[index] = text;
      return newOtp;
    });

    if (text && index < 5) {
      inputs.current[index + 1].focus(); // Move to the next input field
    }
  };

  // Handle backspace press
  const handleBackspace = (text, index) => {
    if (!text && index > 0) {
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index - 1] = '';
        return newOtp;
      });
      inputs.current[index - 1].focus(); // Move to the previous input field
    }
  };

  // Handle OTP resend
  const handleResendOTP = () => {
    setCountdown(59);
    setIsCounting(true);
    // console.log('Resending OTP to:', phoneNumber);
    Alert.alert('OTP Resent', 'A new OTP has been sent to your phone number.');
  };

  const confirmCode = async () => {
    try {
      const otpCode = otp.join('');
      setLoading(true);

      const userCredential = await confirm.confirm(otpCode);
      const idToken = await userCredential.user.getIdToken();
      dispatch(setAuthToken(idToken));

      try {
        const patient = await patientApi.searchByPhone(phoneNumber);
        dispatch(setPatientId(patient.id));
        if (patient.isProfileComplete) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('ProfileScreen', {
            patientId: patient.id,
            authToken: idToken,
          });
        }
      } catch (lookupErr) {
        if (lookupErr.status === 404) {
          navigation.replace('ProfileScreen', { phoneNumber, authToken: idToken });
        } else {
          Alert.alert('Error', 'Could not lookup user. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Invalid code', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={32} color="#000000" />
        </TouchableOpacity>

        {/* Main Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          style={styles.keyboardAvoidingContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {/* Animated Image */}
            <Animated.Image
              source={require('../assets/cuate.jpg')}
              style={[styles.image, { height: imageHeight, width: width * 0.8 }]}
            />

            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to {phoneNumber}
              </Text>
            </View>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    { borderColor: digit ? '#1BBA8D' : '#00000060' },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(digit, index);
                    }
                  }}
                />
              ))}
            </View>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={styles.timerText}>
                00:{`countdown < 10 ? 0${countdown} : countdown`}
              </Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={isCounting}>
                <Text style={[styles.resendText, isCounting && styles.disabledText]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.button, otp.includes('') && styles.buttonDisabled]}
            onPress={confirmCode}
            disabled={otp.includes('') || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
  backButton: {
    position: 'absolute',
    top: width * 0.08,
    left: width * 0.05,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingBottom: width * 0.05,
  },
  image: {
    resizeMode: 'contain',
    marginTop: width * 0.18,
  },
  headingContainer: {
    width: '100%',
    marginTop: width * 0.05,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#164772',
    textAlign: 'left',
    paddingLeft: width * 0.02,
    marginBottom: width * 0.01,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#00000070',
    textAlign: 'left',
    paddingLeft: width * 0.02,
    marginBottom: width * 0.07,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: width * 0.02,
    marginBottom: width * 0.05,
    columnGap: width * 0.02,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: width * 0.02,
    width: width * 0.13,
    height: width * 0.13,
    textAlign: 'center',
    fontSize: width * 0.045,
    color: '#000000',
    backgroundColor: '#fff',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: width * 0.05,
    marginBottom: width * 0.07,
  },
  timerText: {
    fontSize: width * 0.035,
    color: '#28A745',
    marginRight: width * 0.02,
  },
  resendText: {
    fontSize: width * 0.035,
    color: '#2E5BFF',
    fontWeight: '500',
  },
  disabledText: {
    color: '#B3B3B3',
  },
  button: {
    backgroundColor: '#164772',
    paddingVertical: width * 0.028,
    borderRadius: width * 0.038,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    marginBottom: width * 0.15,
  },
  buttonDisabled: {
    backgroundColor: '#16477230',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loaderText: {
    color: '#FFFFFF',
    marginTop: width * 0.02,
    fontSize: width * 0.035,
  },
});

export default OTPScreen;
