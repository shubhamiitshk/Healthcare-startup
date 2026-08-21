import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppointmentReceipt = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    doctorName,
  specialization,
    patientName,
    gender,
    dob, // Added DOB
    relation, // Added Relation
    date,
    timeSlot,
    clinicName,
    clinicAddress,
    fees,
    queueNumber,
  } = route.params; // Get data from navigation

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Appointment Receipt</Text>

        {/* Doctor Info */}
        <View style={styles.detailBox}>
          <Text style={styles.label}>Doctor:</Text>
          <Text style={styles.value}>Dr. {doctorName}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Specialization:</Text>
          <Text style={styles.value}>{specialization}</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.detailBox}>
          <Text style={styles.label}>Patient:</Text>
          <Text style={styles.value}>{patientName}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Gender:</Text>
          <Text style={styles.value}>{gender}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>DOB:</Text>
          <Text style={styles.value}>{dob}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Relation:</Text>
          <Text style={styles.value}>{relation}</Text>
        </View>

        {/* Appointment Info */}
        <View style={styles.detailBox}>
          <Text style={styles.label}>Day:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Time Slot:</Text>
          <Text style={styles.value}>{timeSlot}</Text>
        </View>

        {/* Clinic Info */}
        <View style={styles.detailBox}>
          <Text style={styles.label}>Clinic:</Text>
          <Text style={styles.value}>{clinicName}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Clinic Address:</Text>
          <Text style={styles.value}>{clinicAddress}</Text>
        </View>

        {/* Fees */}
        <View style={styles.detailBox}>
          <Text style={styles.label}>Fees:</Text>
          <Text style={styles.value}>₹{fees}</Text>
        </View>

        {/* Queue Number */}
        <View style={styles.queueBox}>
          <Text style={styles.queueText}>Your Queue Number: {queueNumber}</Text>
        </View>

        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={() => navigation.replace('MainTabs')}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#164772',
  },
  detailBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
  },
  queueBox: {
    backgroundColor: '#1BBA8D20',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  queueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#164772',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#164772',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppointmentReceipt;
