/*
Starter code was copied from https://docs.expo.dev/versions/latest/sdk/map-view/ 
Further edits were made to zoom in and show pins that represent camping spots. 
Video for inspiration/walkthrough is linked here: https://www.youtube.com/watch?v=ZokYgHL6Zrc 
*/

import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  return (
    <View style={styles.container}>
      <MapView style={styles.map}
          region={{
            latitude: 33.37355939036438, 
            longitude: -117.56367006190153,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{
              latitude: 33.37355939036438, 
              longitude: -117.56367006190153
            }}
            title='Camp Spot: San Onofre'
            description='Open During Summer Months, paid spots with amenities'
          />

          <Marker
            coordinate={{
              latitude: 33.40508368050879,
              longitude: -117.58395822568862 
            }}
            title='Camp Spot: San Mateo'
            description='Open During Summer Months, paid spots with amenities'
          />

      </MapView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
