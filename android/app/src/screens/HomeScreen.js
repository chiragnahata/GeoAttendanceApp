import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { geohashForLocation } from 'geofire-common';
import BackgroundTimer from 'react-native-background-timer';

const GEOFENCE_RADIUS = 200; // meters
const OFFICE_LOCATION = { latitude: 0, longitude: 0 }; // Replace with actual office coordinates

const HomeScreen = ({ navigation }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);

  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      handleLocationChange,
      (error) => console.log(error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => Geolocation.clearWatch(watchId);
  }, []);

  const handleLocationChange = (position) => {
    const { latitude, longitude } = position.coords;
    setLastLocation({ latitude, longitude });

    const distance = calculateDistance(latitude, longitude, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude);

    if (distance <= GEOFENCE_RADIUS) {
      if (!isCheckedIn) {
        handleCheckIn();
      }
    } else {
      if (isCheckedIn) {
        handleCheckOut();
      }
    }
  };

  const handleCheckIn = async () => {
    try {
      const user = auth().currentUser;
      await firestore().collection('attendance').add({
        userId: user.uid,
        type: 'check-in',
        timestamp: firestore.FieldValue.serverTimestamp(),
        location: new firestore.GeoPoint(lastLocation.latitude, lastLocation.longitude),
        geohash: geohashForLocation([lastLocation.latitude, lastLocation.longitude])
      });
      setIsCheckedIn(true);
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const user = auth().currentUser;
      await firestore().collection('attendance').add({
        userId: user.uid,
        type: 'check-out',
        timestamp: firestore.FieldValue.serverTimestamp(),
        location: new firestore.GeoPoint(lastLocation.latitude, lastLocation.longitude),
        geohash: geohashForLocation([lastLocation.latitude, lastLocation.longitude])
      });
      setIsCheckedIn(false);
    } catch (error) {
      console.error('Check-out error:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance between two points
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {isCheckedIn ? 'You are checked in' : 'You are checked out'}
      </Text>
      <Button mode="contained" onPress={() => navigation.navigate('AttendanceHistory')}>
        View Attendance History
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  status: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default HomeScreen;