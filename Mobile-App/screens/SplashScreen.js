import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onAnimationEnd = () => {} }) => {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.ease });
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });

    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 1000 });
      textTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
    }, 1000);

    setTimeout(() => {
      if (typeof onAnimationEnd === 'function') {
        onAnimationEnd();
      }
    }, 2500);
  }, [onAnimationEnd, logoOpacity, logoScale, textOpacity, textTranslateY]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require('../assets/logo.png')} // Replace with your logo
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.splashText}>CareQ </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    textAlign:'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#164772',
  },
});

export default SplashScreen;
