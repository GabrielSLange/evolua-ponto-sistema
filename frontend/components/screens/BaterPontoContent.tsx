import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Platform, StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import * as Location from "expo-location";
import haversine from "haversine-distance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { baterPonto } from "@/hooks/employee/useBaterPonto";
import { useFocusEffect } from "expo-router";
import CustomLoader from "@/components/CustomLoader";
import api from "@/services/api";
import { useNotification } from "@/contexts/NotificationContext";
import { SegmentedButtons, useTheme } from "react-native-paper";

/* ---------- helper: inject leaflet CSS via CDN (web only) ---------- */
function ensureLeafletCss() {
   if (typeof document === "undefined") return;
   const id = "leaflet-css-cdn";
   if (document.getElementById(id)) return;
   const link = document.createElement("link");
   link.id = id;
   link.rel = "stylesheet";
   link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
   document.head.appendChild(link);
}

/* ---------- Web map module loader (dynamic) ---------- */
let WebMapModule: any = null;
if (Platform.OS === "web") {
   try {
      ensureLeafletCss();
      WebMapModule = require("react-leaflet");
      const L = require("leaflet");
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
         iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
         iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
         shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
   } catch (e) {
      // ignore
   }
}

export default function BaterPontoContent() {
   const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
   const [establishmentCoords, setEstablishmentCoords] = useState<{ latitude: number; longitude: number; } | null>(null);
   const [distance, setDistance] = useState<number | null>(null);
   const [isWithinRadius, setIsWithinRadius] = useState(false);
   const [currentTime, setCurrentTime] = useState(new Date());
   const [errorMsg, setErrorMsg] = useState<string | null>(null);
   const { showNotification } = useNotification();
   const [allowedRadius, setAllowedRadius] = useState(1000);
   const theme = useTheme();
   const [tipoPonto, setTipoPonto] = useState('ENTRADA');

   const { loading, funcionario, tipoBatida, SetLoading } = baterPonto();
   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
   const [initialCenterCoords, setInitialCenterCoords] = useState<{ latitude: number; longitude: number } | null>(null);


   const fetchCarregarLocalizaçãoEstabelecimento = useCallback(() => {
      setEstablishmentCoords({
         latitude: funcionario?.estabelecimento?.latitude ?? 0,
         longitude: funcionario?.estabelecimento?.longitude ?? 0
      });
      if (funcionario?.estabelecimento?.raioKm !== undefined) {
         setAllowedRadius(funcionario?.estabelecimento?.raioKm * 1000);
      }
      if(tipoBatida === "ENTRADA"){
         setTipoPonto("SAIDA");
      }
      else{
         setTipoPonto("ENTRADA");
      }
   }, [funcionario]);

   useFocusEffect(fetchCarregarLocalizaçãoEstabelecimento);

   const watchRef = useRef<any>(null);
   const mapRefNative = useRef<any>(null);
   const recoveryTimer = useRef<any>(null);

   useEffect(() => {
      let mounted = true;

      function startLocationWatch(tryHighAccuracy: boolean) {
         if (watchRef.current != null) {
            navigator.geolocation.clearWatch(watchRef.current);
            watchRef.current = null;
         }

         if (recoveryTimer.current) {
            clearTimeout(recoveryTimer.current);
            recoveryTimer.current = null;
         }

         const options = {
            enableHighAccuracy: tryHighAccuracy,
            maximumAge: 2000,
            timeout: 5000
         };

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
               setLocationPermissionGranted(true);
               setErrorMsg(null);

               if (!initialCenterCoords) {
                  setInitialCenterCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
               }

               calcDistanceAndState(location);

               if (!tryHighAccuracy && !recoveryTimer.current) {
                  recoveryTimer.current = setTimeout(() => {
                     if (mounted) {
                        startLocationWatch(true);
                     }
                  }, 30000);
               }
            },
            (err) => {
               if (!mounted) return;

               if (err.code === err.PERMISSION_DENIED) {
                  setErrorMsg("Permissão de localização negada.");
                  setLocationPermissionGranted(false);
                  if (establishmentCoords) {
                     setInitialCenterCoords({ latitude: establishmentCoords.latitude, longitude: establishmentCoords.longitude });
                  }
               } else if (tryHighAccuracy) {
                  setErrorMsg("GPS indisponível, usando localização aproximada.");
                  startLocationWatch(false);
               } else {
                  setErrorMsg("GPS indisponível, usando localização aproximada.");
                  if (establishmentCoords) {
                     setInitialCenterCoords({ latitude: establishmentCoords.latitude, longitude: establishmentCoords.longitude });
                  }
               }
            },
            options
         );
      }


      async function setup() {
         try {
            let permissionGranted = false;
            if (Platform.OS === "web") {
               if (!("geolocation" in navigator)) {
                  setErrorMsg("Geolocalização não disponível no navegador.");
                  return;
               }

               startLocationWatch(true);

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
                  (err) => {
                     if (!mounted) return;
                     if (err.code === err.PERMISSION_DENIED) {
                        setErrorMsg("Permissão de localização negada.");
                     } else {
                        setErrorMsg(err.message ?? "Erro ao atualizar localização.");
                     }
                  },
                  { enableHighAccuracy: false, maximumAge: 2000, timeout: 5000 }
               );
            } else {
               const { status } = await Location.requestForegroundPermissionsAsync();
               if (status !== "granted") {
                  setErrorMsg("Permissão para acessar a localização foi negada.");
                  setLocationPermissionGranted(false);
                  return;
               }
               permissionGranted = true;
               setLocationPermissionGranted(true)

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
         if (recoveryTimer.current) {
            clearTimeout(recoveryTimer.current);
            recoveryTimer.current = null;
         }
         try {
            if (Platform.OS === "web" && watchRef.current != null) {
               navigator.geolocation.clearWatch(watchRef.current);
               watchRef.current = null;
            } else if (watchRef.current && typeof watchRef.current.remove === "function") {
               watchRef.current.remove();
               watchRef.current = null;
            }
         } catch {
            // ignore
         }
      };
   }, [establishmentCoords, initialCenterCoords]);

   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   function calcDistanceAndState(location: Location.LocationObject) {
      if (!establishmentCoords) return;
      const userCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const dist = haversine(userCoords, establishmentCoords);
      setDistance(dist);
      setIsWithinRadius(dist <= allowedRadius);
   }

   const handleBaterPonto = async () => {
      const formData = new FormData();
      formData.append('Tipo', tipoPonto);
      formData.append('FuncionarioId', `${funcionario?.id}`);

      try {
         SetLoading(true);
         const response = await api.post("RegistroPonto", formData);
         showNotification("Ponto batido com sucesso!", "success");
         if(tipoPonto === "ENTRADA"){
            setTipoPonto("SAIDA");
         }
         else{
            setTipoPonto("ENTRADA");
         }
      } catch (error) {
         console.error("Erro ao bater ponto:", error);
         showNotification("Erro ao registrar ponto.", "error"); 
      }
      finally {
         SetLoading(false);
      }
   };

   useEffect(() => {
      if (tipoBatida) {

         if (tipoBatida === 'ENTRADA') {
            setTipoPonto('SAIDA');
         } 
         else {
            setTipoPonto('ENTRADA');
         }
      }
   }, [tipoBatida]);

   const statusText = errorMsg
      ? errorMsg
      : distance === null
         ? "Verificando localização..."
         : isWithinRadius
            ? `Você está a ${Math.round(distance)} m do local.`
            : `Você está a ${Math.round(distance)} m do local. Aproxime-se para bater o ponto.`;


   return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
         {Platform.OS === "web" ? (
            <View style={styles.map}>
               {WebMapModule ? (
                  <Suspense fallback={<View style={styles.center}><Text style={{ color: theme.colors.onSurface }}>Carregando mapa web...</Text></View>}>
                     <WebLeafletMap
                        initialCenter={initialCenterCoords}
                        userLocation={userLocation}
                        establishmentCoords={establishmentCoords}
                        allowedRadius={allowedRadius}
                     />
                  </Suspense>
               ) : (
                  <View style={styles.center}>
                     <Text style={{ color: theme.colors.onSurface }}>Mapa web indisponível.</Text>
                  </View>
               )}
            </View>
         ) : (
            <NativeMap
               refMap={mapRefNative}
               establishmentCoords={establishmentCoords}
               allowedRadius={allowedRadius}
               primaryColor={theme.colors.primary}
            />
         )}

         <View style={styles.bottomContainer}>
            <Text style={[
               styles.statusText,
               { color: errorMsg ? theme.colors.error : theme.colors.onSurface }
            ]}>
               {statusText}
            </Text>
            
            <Text style={[styles.clockText, { color: theme.colors.onSurface }]}>
               {format(currentTime, "HH:mm:ss", { locale: ptBR })}
            </Text>
            
            <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
               {format(currentTime, "eeee, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>

            <View style={{ width: '80%', marginBottom: 20 }}>
               <SegmentedButtons
                  value={tipoPonto}
                  onValueChange={setTipoPonto}
                  buttons={[
                     {
                        value: 'ENTRADA',
                        label: 'Entrada',
                        icon: 'login',
                        style: { 
                           backgroundColor: tipoPonto === 'ENTRADA' 
                              ? theme.colors.primaryContainer
                              : undefined 
                        }
                     },
                     {
                        value: 'SAIDA',
                        label: 'Saída',
                        icon: 'logout', // Ícone de sair
                        style: { 
                           backgroundColor: tipoPonto === 'SAIDA' 
                              ? theme.colors.errorContainer // Cor diferente para saída (opcional)
                              : undefined 
                        }
                     },
                  ]}
               />
            </View>

            <TouchableOpacity
               style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary}
               ]}
               onPress={handleBaterPonto}
            >
               <Text style={[
                   styles.buttonText, 
                   { color:theme.colors.onPrimary}
               ]}>
                   Bater Ponto
               </Text>
            </TouchableOpacity>
         </View>

         <Modal
            transparent={true}
            animationType="fade"
            visible={loading}
         >
            <View style={styles.loaderOverlay}>
               <CustomLoader />
            </View>
         </Modal>
      </View>
   );
}

/* ---------- Native map (dynamically require react-native-maps) ---------- */
function NativeMap({ refMap, establishmentCoords, allowedRadius, primaryColor }: any) {
   let MapView: any = null;
   let Marker: any = null;
   let Circle: any = null;
   try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RNM = eval("require")("react-native-maps");
      MapView = RNM.default ?? RNM;
      Marker = RNM.Marker ?? RNM.Marker;
      Circle = RNM.Circle ?? RNM.Circle;
   } catch (e) {
      return (
         <View style={styles.map}>
            <Text>Mapa nativo não disponível</Text>
         </View>
      );
   }

   // Função para converter hex para rgba (para o fill do circulo)
   const hexToRgba = (hex: string, opacity: number) => {
        let c: any;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opacity+')';
        }
        return 'rgba(0,0,255,0.12)'; // Fallback azul
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
         <Marker 
            coordinate={establishmentCoords} 
            title="Seu Local de Trabalho" 
            pinColor={primaryColor} // 6. Pin da cor do tema
         />
         <Circle
            center={establishmentCoords}
            radius={allowedRadius}
            strokeColor={primaryColor} // 7. Borda do círculo da cor do tema
            fillColor={hexToRgba(primaryColor, 0.2)} // 8. Preenchimento transparente da cor do tema
         />
      </MapView>
   );
}

/* ---------- Web Leaflet map component (kept inside same file) ---------- */
function WebLeafletMap({ initialCenter, establishmentCoords, userLocation, allowedRadius }: any) {
   const { MapContainer, TileLayer, Marker, Circle } = WebMapModule;

   const lat = initialCenter?.latitude ?? establishmentCoords?.latitude ?? 0;
   const lng = initialCenter?.longitude ?? establishmentCoords?.longitude ?? 0;

   const mapInitialCenter: [number, number] = [lat, lng];
   const mapInitialZoom = 15;

   if (!lat || !lng) {
      return (
         <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p>Obtendo coordenadas...</p>
         </div>
      );
   }

   return (
      <div style={{ width: "100%", height: "100%" }}>
         <MapContainer
            center={mapInitialCenter}
            zoom={mapInitialZoom}
            style={{ width: "100%", height: "100%" }}
         >
             {/* Nota: Tiles do OSM são sempre claros. Para mudar, precisa de provedor customizado */}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
   container: {
      flex: 1
   },
   map: {
      width: "100%",
      height: "50%"
   },
   bottomContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20
   },
   statusText: {
      fontSize: 16,
      marginBottom: 12,
      textAlign: "center"
   },
   clockText: {
      fontSize: 48,
      fontWeight: "bold"
   },
   dateText: {
      fontSize: 18,
      marginBottom: 20
   },
   button: {
      width: "80%",
      padding: 16,
      borderRadius: 10,
      alignItems: "center"
   },
   buttonText: {
      fontSize: 18,
      fontWeight: "bold"
   },
   center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
   },
   loaderOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      alignItems: 'center',
      justifyContent: 'center',
   },
});