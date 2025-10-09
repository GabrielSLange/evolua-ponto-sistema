// frontend/app/(employee)/bater-ponto.tsx
import React, { useEffect, useRef, useState, Suspense } from "react";
import { Platform, StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import haversine from "haversine-distance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * IMPORTANT:
 * - DO NOT import 'react-native-maps' at top-level (it breaks web).
 * - We'll require it dynamically for native only.
 * - For web, we'll use react-leaflet loaded dynamically.
 */

/* ---------- constants ---------- */
const establishmentCoords = {
   latitude: -16.6799,
   longitude: -49.255,
};
const allowedRadius = 1000; // metros

/* ---------- helper: inject leaflet CSS via CDN (web only) ---------- */
function ensureLeafletCss() {
   if (typeof document === "undefined") return;
   const id = "leaflet-css-cdn";
   if (document.getElementById(id)) return;
   const link = document.createElement("link");
   link.id = id;
   link.rel = "stylesheet";
   // CDN link avoids bundling image urls from node_modules CSS
   link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
   document.head.appendChild(link);
}

/* ---------- Web map module loader (dynamic) ---------- */
let WebMapModule: any = null;
if (Platform.OS === "web") {
   try {
      // inject CSS from CDN
      ensureLeafletCss();
      WebMapModule = require("react-leaflet");
      // fix icon paths if needed (leaflet images will be loaded from CDN CSS so this is optional)
      const L = require("leaflet");
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
         iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
         iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
         shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
   } catch (e) {
      // ignore; errors will surface later if user opens web map
      // console.warn("Failed to load react-leaflet (web):", e);
   }
}

export default function BaterPontoScreen() {
   const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
   const [distance, setDistance] = useState<number | null>(null);
   const [isWithinRadius, setIsWithinRadius] = useState(false);
   const [currentTime, setCurrentTime] = useState(new Date());
   const [errorMsg, setErrorMsg] = useState<string | null>(null);

   const watchRef = useRef<any>(null);
   const mapRefNative = useRef<any>(null);

   useEffect(() => {
      let mounted = true;

      async function setup() {
         try {
            if (Platform.OS === "web") {
               if (!("geolocation" in navigator)) {
                  setErrorMsg("Geolocalização não disponível no navegador.");
                  return;
               }

               navigator.geolocation.getCurrentPosition(
                  (pos) => {
                     if (!mounted) return;
                     const location = {
                        coords: {
                           latitude: pos.coords.latitude,
                           longitude: pos.coords.longitude,
                           altitude: pos.coords.altitude ?? 0,
                           accuracy: pos.coords.accuracy ?? 0,
                        },
                        timestamp: pos.timestamp,
                     } as Location.LocationObject;
                     setUserLocation(location);
                     calcDistanceAndState(location);
                  },
                  (err) => setErrorMsg(err.message ?? "Erro ao obter localização (web)."),
                  { enableHighAccuracy: true, maximumAge: 10000 }
               );

               watchRef.current = navigator.geolocation.watchPosition(
                  (pos) => {
                     if (!mounted) return;
                     const location = {
                        coords: {
                           latitude: pos.coords.latitude,
                           longitude: pos.coords.longitude,
                           altitude: pos.coords.altitude ?? 0,
                           accuracy: pos.coords.accuracy ?? 0,
                        },
                        timestamp: pos.timestamp,
                     } as Location.LocationObject;
                     setUserLocation(location);
                     calcDistanceAndState(location);
                  },
                  () => { },
                  { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
               );
            } else {
               const { status } = await Location.requestForegroundPermissionsAsync();
               if (status !== "granted") {
                  setErrorMsg("Permissão para acessar a localização foi negada.");
                  return;
               }

               const last = await Location.getLastKnownPositionAsync();
               if (mounted && last) {
                  setUserLocation(last);
                  calcDistanceAndState(last);
               }

               watchRef.current = await Location.watchPositionAsync(
                  { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
                  (loc) => {
                     if (!mounted) return;
                     setUserLocation(loc);
                     calcDistanceAndState(loc);
                  }
               );
            }
         } catch (err: any) {
            setErrorMsg(err?.message ?? "Erro ao obter localização");
         }
      }

      setup();

      return () => {
         mounted = false;
         try {
            if (Platform.OS === "web" && watchRef.current != null) {
               navigator.geolocation.clearWatch(watchRef.current);
               watchRef.current = null;
            } else if (watchRef.current && typeof watchRef.current.remove === "function") {
               watchRef.current.remove();
               watchRef.current = null;
            }
         } catch {
            // ignore cleanup errors
         }
      };
   }, []);

   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   function calcDistanceAndState(location: Location.LocationObject) {
      const userCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const dist = haversine(userCoords, establishmentCoords); // metros
      setDistance(dist);
      setIsWithinRadius(dist <= allowedRadius);
   }

   const handleBaterPonto = () => {
      if (!isWithinRadius) {
         Alert.alert("Fora do raio", "Você precisa estar mais próximo do local para bater o ponto.");
         return;
      }
      Alert.alert("Sucesso", `Ponto batido às ${format(new Date(), "HH:mm:ss")}`);
   };

   const statusText = errorMsg
      ? errorMsg
      : distance === null
         ? "Verificando localização..."
         : isWithinRadius
            ? `Você está a ${Math.round(distance)} m do local.`
            : `Você está a ${Math.round(distance)} m do local. Aproxime-se para bater o ponto.`;

   /* ---------- RENDER ---------- */
   return (
      <View style={styles.container}>
         {Platform.OS === "web" ? (
            <View style={styles.map}>
               {/* render web map (leaflet) */}
               {WebMapModule ? (
                  <Suspense fallback={<View style={styles.center}><Text>Carregando mapa web...</Text></View>}>
                     <WebLeafletMap
                        userLocation={userLocation}
                        establishmentCoords={establishmentCoords}
                        allowedRadius={allowedRadius}
                     />
                  </Suspense>
               ) : (
                  <View style={styles.center}>
                     <Text>Mapa web indisponível (react-leaflet não carregado).</Text>
                  </View>
               )}
            </View>
         ) : (
            <NativeMap
               refMap={mapRefNative}
               establishmentCoords={establishmentCoords}
               allowedRadius={allowedRadius}
            />
         )}

         <View style={styles.bottomContainer}>
            <Text style={styles.statusText}>{statusText}</Text>
            <Text style={styles.clockText}>{format(currentTime, "HH:mm:ss", { locale: ptBR })}</Text>
            <Text style={styles.dateText}>
               {format(currentTime, "eeee, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>

            <TouchableOpacity
               style={[styles.button, { backgroundColor: isWithinRadius ? "#4CAF50" : "#CCCCCC" }]}
               onPress={handleBaterPonto}
               disabled={!isWithinRadius}
            >
               <Text style={styles.buttonText}>Bater Ponto</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

/* ---------- Native map (dynamically require react-native-maps) ---------- */
function NativeMap({ refMap, establishmentCoords, allowedRadius }: any) {
   // require only on native to prevent web bundler from resolving native-only modules
   let MapView: any = null;
   let Marker: any = null;
   let Circle: any = null;
   try {
      // dynamic require: only executed on native
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RNM = eval("require")("react-native-maps");
      MapView = RNM.default ?? RNM;
      Marker = RNM.Marker ?? RNM.Marker;
      Circle = RNM.Circle ?? RNM.Circle;
   } catch (e) {
      // if require fails, render fallback
      return (
         <View style={styles.map}>
            <Text>Mapa nativo não disponível</Text>
         </View>
      );
   }

   const initialRegion = {
      latitude: establishmentCoords.latitude,
      longitude: establishmentCoords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
   };

   return (
      <MapView
         ref={(r: any) => (refMap.current = r)}
         style={styles.map}
         initialRegion={initialRegion}
         showsUserLocation
         showsMyLocationButton
         loadingEnabled
      >
         <Marker coordinate={establishmentCoords} title="Seu Local de Trabalho" pinColor="blue" />
         <Circle
            center={establishmentCoords}
            radius={allowedRadius}
            strokeColor="rgba(0,0,255,0.5)"
            fillColor="rgba(0,0,255,0.12)"
         />
      </MapView>
   );
}

/* ---------- Web Leaflet map component (kept inside same file) ---------- */
function WebLeafletMap({ userLocation, establishmentCoords, allowedRadius }: any) {
   if (!WebMapModule) return null;
   const { MapContainer, TileLayer, Marker, Circle } = WebMapModule;
   const center = userLocation
      ? [userLocation.coords.latitude, userLocation.coords.longitude]
      : [establishmentCoords.latitude, establishmentCoords.longitude];
   const zoom = 15;

   // react-leaflet expects DOM elements, so render a div wrapper
   return (
      <div style={{ width: "100%", height: "100%" }}>
         <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%" }}>
            <TileLayer
               attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[establishmentCoords.latitude, establishmentCoords.longitude]} />
            <Circle center={[establishmentCoords.latitude, establishmentCoords.longitude]} radius={allowedRadius} />
            {userLocation && (
               <Marker position={[userLocation.coords.latitude, userLocation.coords.longitude]} />
            )}
         </MapContainer>
      </div>
   );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
   container: { flex: 1 },
   map: { width: "100%", height: "50%" },
   bottomContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
   statusText: { fontSize: 16, marginBottom: 12, textAlign: "center" },
   clockText: { fontSize: 48, fontWeight: "bold" },
   dateText: { fontSize: 18, marginBottom: 20 },
   button: { width: "80%", padding: 16, borderRadius: 10, alignItems: "center" },
   buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
   center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
