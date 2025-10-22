// frontend/components/InteractiveMap.tsx
import React, { useRef, useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// ... (todo o bloco de `ensureLeafletCss` e `WebMapModule` continua igual) ...
function ensureLeafletCss() {
   if (typeof document === 'undefined') return;
   const id = 'leaflet-css-cdn';
   if (document.getElementById(id)) return;
   const link = document.createElement('link');
   link.id = id;
   link.rel = 'stylesheet';
   link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
   document.head.appendChild(link);
}

let WebMapModule: any = null;
if (Platform.OS === 'web') {
   try {
      ensureLeafletCss();
      WebMapModule = require('react-leaflet');
      const L = require('leaflet');
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
         iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
         iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
         shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
   } catch (e) {
      console.warn("Falha ao carregar react-leaflet:", e)
   }
}

// --- PROPS DO NOSSO COMPONENTE ---
interface InteractiveMapProps {
   // MUDANÇA 1: Renomeamos 'initialRegion' para 'region' para refletir que ela pode mudar
   region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; };
   markerCoordinate?: { latitude: number; longitude: number } | null;
   onMapPress: (coords: { latitude: number; longitude: number }) => void;
   style?: any;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
   region,
   markerCoordinate,
   onMapPress,
   style = styles.map,
}) => {
   return Platform.OS === 'web'
      ? <WebMap {...{ region, markerCoordinate, onMapPress, style }} />
      : <NativeMap {...{ region, markerCoordinate, onMapPress, style }} />;
};


const NativeMap: React.FC<InteractiveMapProps> = ({ region, markerCoordinate, onMapPress, style }) => {
   // MUDANÇA 2: Adicionamos uma ref para controlar o mapa nativo
   const mapRef = useRef<any>(null);

   // MUDANÇA 3: Usamos useEffect para mover o mapa quando a 'region' mudar
   useEffect(() => {
      if (mapRef.current) {
         mapRef.current.animateToRegion(region, 1000); // Anima em 1 segundo
      }
   }, [region]);

   try {
      const RNM = eval("require")("react-native-maps");
      const MapView = RNM.default ?? RNM;
      const Marker = RNM.Marker;

      const handlePress = (e: any) => {
         onMapPress(e.nativeEvent.coordinate);
      };

      return (
         <MapView
            ref={mapRef} // Atribuímos a ref ao componente
            style={style}
            initialRegion={region} // A região inicial ainda é usada na primeira renderização
            onPress={handlePress}
         >
            {markerCoordinate && <Marker coordinate={markerCoordinate} />}
         </MapView>
      );
   } catch (e) {
      return <View style={style}><Text>Mapa nativo indisponível</Text></View>;
   }
};

const WebMap: React.FC<InteractiveMapProps> = ({ region, markerCoordinate, onMapPress, style }) => {
   if (!WebMapModule) return <View style={style}><Text>Mapa web indisponível</Text></View>;

   const { MapContainer, TileLayer, Marker, useMapEvents } = WebMapModule;

   const MapController = () => {
      const map = useMapEvents({
         click(e: any) {
            onMapPress({ latitude: e.latlng.lat, longitude: e.latlng.lng });
         },
      });

      // MUDANÇA 4: Usamos useEffect para mover o mapa web quando a 'region' mudar
      useEffect(() => {
         map.setView([region.latitude, region.longitude], 15); // Define o centro e o zoom
      }, [region, map]);

      return null;
   };

   const center: [number, number] = [region.latitude, region.longitude];

   return (
      <div style={style}>
         <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markerCoordinate && <Marker position={[markerCoordinate.latitude, markerCoordinate.longitude]} />}
            <MapController />
         </MapContainer>
      </div>
   );
};

const styles = StyleSheet.create({
   map: { width: '100%', height: 300 },
});