import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { geohashForLocation } from 'geofire-common';

const CheckIn = ({ navigation }) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
      },
      (error) => console.log('Error', error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }, []);

  const handleCheckIn = async () => {
    if (!location) {
      alert('Unable to get location. Please try again.');
      return;
    }

    try {
      const user = auth().currentUser;
      await firestore().collection('attendance').add({
        userId: user.uid,
        type: 'check-in',
        timestamp: firestore.FieldValue.serverTimestamp(),
        location: new firestore.GeoPoint(location.latitude, location.longitude),
        geohash: geohashForLocation([location.latitude, location.longitude])
      });
      alert('Check-in successful!');
      navigation.goBack();
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Check-in failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check In</Text>
      {location && (
        <Text>
          Current Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
      )}
      <Button mode="contained" onPress={handleCheckIn} style={styles.button}>
        Confirm Check In
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
});

export default CheckIn;