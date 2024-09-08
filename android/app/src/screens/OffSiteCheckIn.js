import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { requestLocationPermission } from '../utils/geolocation';
import Button from '../components/Button';

const OffSiteCheckIn = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  useEffect(() => {
    const getLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        Geolocation.getCurrentPosition(
          (position) => {
            setLocation(position.coords);
            fetchNearbyPlaces(position.coords);
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

  const fetchNearbyPlaces = async (coords) => {
    // This is a placeholder. In a real app, you would use a service like OpenStreetMap API
    // to fetch nearby places based on the coordinates.
    setNearbyPlaces([
      { id: '1', name: 'Nearby Office 1' },
      { id: '2', name: 'Nearby Office 2' },
      { id: '3', name: 'Nearby Office 3' },
    ]);
  };

  const handleOffSiteCheckIn = async (place) => {
    if (!location) {
      alert('Unable to get location. Please try again.');
      return;
    }

    try {
      const user = auth().currentUser;
      await firestore().collection('attendance').add({
        userId: user.uid,
        type: 'off-site-check-in',
        timestamp: firestore.FieldValue.serverTimestamp(),
        location: new firestore.GeoPoint(location.latitude, location.longitude),
        place: place.name,
      });
      alert('Off-site check-in successful!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Off-site check-in failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Off-Site Check In</Text>
      {location && (
        <Text>
          Current Location: {location.latitude}, {location.longitude}
        </Text>
      )}
      <FlatList
        data={nearbyPlaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Button
            title={item.name}
            onPress={() => handleOffSiteCheckIn(item)}
          />
        )}
      />
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

export default OffSiteCheckIn;