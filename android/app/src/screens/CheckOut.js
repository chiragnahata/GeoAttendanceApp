import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { requestLocationPermission } from '../utils/geolocation';
import Button from '../components/Button';

const CheckOut = ({ navigation }) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const getLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        Geolocation.getCurrentPosition(
          (position) => {
            setLocation(position.coords);
          },
          (error) => {
            console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    };

    getLocation();
  }, []);

  const handleCheckOut = async () => {
    if (!location) {
      alert('Unable to get location. Please try again.');
      return;
    }

    try {
      const user = auth().currentUser;
      await firestore().collection('attendance').add({
        userId: user.uid,
        type: 'check-out',
        timestamp: firestore.FieldValue.serverTimestamp(),
        location: new firestore.GeoPoint(location.latitude, location.longitude),
      });
      alert('Check-out successful!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Check-out failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check Out</Text>
      {location && (
        <Text>
          Current Location: {location.latitude}, {location.longitude}
        </Text>
      )}
      <Button title="Confirm Check Out" onPress={handleCheckOut} />
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
});

export default CheckOut;