import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Platform, StyleSheet, Text, View, TouchableOpacity, Modal, useWindowDimensions } from "react-native";
import * as Location from "expo-location";
import haversine from "haversine-distance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { baterPonto } from "@/hooks/employee/useBaterPonto";
import { useFocusEffect } from "expo-router";
import CustomLoader from "@/components/CustomLoader";
import api from "@/services/api";
import { useNotification } from "@/contexts/NotificationContext";
import { SegmentedButtons, useTheme, ActivityIndicator, Portal, Modal as PaperModal } from "react-native-paper";

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
    const [confirmModelVisible, setConfirmModelVisible] = useState(false);
    const { width } = useWindowDimensions();

    const isDesktop = Platform.OS === 'web' && width > 768;

    // Estado para controlar a "tentativa forçada" de pegar o GPS
    const [isGpsLoading, setIsGpsLoading] = useState(true);

    const { loading, funcionario, tipoBatida, SetLoading } = baterPonto();
    const [, setLocationPermissionGranted] = useState(false);
    const [initialCenterCoords, setInitialCenterCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const fetchCarregarLocalizaçãoEstabelecimento = useCallback(() => {
        setEstablishmentCoords({
            latitude: funcionario?.estabelecimento?.latitude ?? 0,
            longitude: funcionario?.estabelecimento?.longitude ?? 0
        });
        if (funcionario?.estabelecimento?.raioKm !== undefined) {
            setAllowedRadius(funcionario?.estabelecimento?.raioKm * 1000);
        }
        if (tipoBatida === "ENTRADA") {
            setTipoPonto("SAIDA");
        }
        else {
            setTipoPonto("ENTRADA");
        }
    }, [funcionario]);

    useFocusEffect(fetchCarregarLocalizaçãoEstabelecimento);

    const watchRef = useRef<any>(null);
    const mapRefNative = useRef<any>(null);
    const recoveryTimer = useRef<any>(null);

    // Efeito para liberar o botão após 10 segundos se o GPS falhar (Timeout de Segurança)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (isGpsLoading) {
                setIsGpsLoading(false);
            }
        }, 10000); // 10 Segundos de espera máxima

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        let mounted = true;

        function startLocationWatch(tryHighAccuracy: boolean) {
            if (watchRef.current != null) {
                // Limpeza segura dependendo da plataforma
                if (Platform.OS === 'web') navigator.geolocation.clearWatch(watchRef.current);
                else if (watchRef.current.remove) watchRef.current.remove();
                
                watchRef.current = null;
            }

            if (recoveryTimer.current) {
                clearTimeout(recoveryTimer.current);
                recoveryTimer.current = null;
            }

            // WEB GEOLOCATION
            if (Platform.OS === 'web') {
                const options = {
                    enableHighAccuracy: true, // Força alta precisão na web
                    maximumAge: 0, // Não aceita cache velho
                    timeout: 10000
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
                        
                        // Se conseguiu localização, libera o loading do GPS
                        setIsGpsLoading(false);

                        if (!initialCenterCoords) {
                            setInitialCenterCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
                        }

                        calcDistanceAndState(location);
                    },
                    (err) => {
                        if (!mounted) return;
                        // Se der erro na web, não travamos o usuário, liberamos via timeout ou aqui
                        if (err.code === err.PERMISSION_DENIED) {
                            setErrorMsg("Permissão negada. O ponto será registrado sem localização.");
                            setIsGpsLoading(false); 
                        }
                    },
                    options
                );
            } 
            // NATIVE GEOLOCATION (EXPO)
            else {
                (async () => {
                    try {
                        // Solicita permissão se ainda não tem
                        const { status } = await Location.requestForegroundPermissionsAsync();
                        if (status !== 'granted') {
                            setErrorMsg("Permissão negada. O ponto será registrado sem localização.");
                            setIsGpsLoading(false);
                            return;
                        }

                        // Tenta pegar a última conhecida rapidamente enquanto o GPS aquece
                        const last = await Location.getLastKnownPositionAsync();
                        if (mounted && last) {
                            setUserLocation(last);
                            calcDistanceAndState(last);
                        }

                        // Watch Position com precisão MÁXIMA
                        watchRef.current = await Location.watchPositionAsync(
                            { 
                                // MELHORIA: Usar BestForNavigation para garantir coordenadas exatas
                                accuracy: Location.Accuracy.BestForNavigation, 
                                timeInterval: 1000, 
                                distanceInterval: 0 
                            },
                            (loc) => {
                                if (!mounted) return;
                                setUserLocation(loc);
                                calcDistanceAndState(loc);
                                
                                // Libera o botão assim que tivermos uma leitura válida
                                setIsGpsLoading(false);
                            }
                        );

                    } catch (e: any) {
                         setErrorMsg("Erro no GPS. Aguarde ou reinicie.");
                    }
                })();
            }
        }


        async function setup() {
            // Inicia o processo
            startLocationWatch(true);
        }

        setup();

        return () => {
            mounted = false;
            if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
            // Limpeza do watchRef
            if (watchRef.current) {
                if (Platform.OS === 'web') navigator.geolocation.clearWatch(watchRef.current);
                else if (watchRef.current.remove) watchRef.current.remove();
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
        formData.append('LatitudeEstabelecimento', `${establishmentCoords?.latitude}`);
        formData.append('LongitudeEstabelecimento', `${establishmentCoords?.longitude}`);
        formData.append('RaioEstabelecimento', `${allowedRadius}`);


        // MELHORIA: Enviando as coordenadas para o Backend
        if (userLocation && userLocation.coords) {
            // Convertendo para string para garantir envio no FormData
            formData.append('Latitude', String(userLocation.coords.latitude));
            formData.append('Longitude', String(userLocation.coords.longitude));
            
            // Opcional: Enviar precisão para saber se o GPS estava bom
            formData.append('PrecisaoMetros', String(userLocation.coords.accuracy));
        } else {
            // Opcional: Enviar flag avisando que foi sem GPS
            // formData.append('SemGps', 'true');
            console.warn("Enviando ponto sem coordenadas!");
        }

        try {
            SetLoading(true);
            const response = await api.post("RegistroPonto", formData);
            showNotification("Ponto batido com sucesso!", "success");
            if (tipoPonto === "ENTRADA") {
                setTipoPonto("SAIDA");
            }
            else {
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
        : isGpsLoading 
            ? "Buscando satélites..." // Feedback visual
            : distance === null
                ? "Verificando localização..."
                : isWithinRadius
                    ? `Você está a ${Math.round(distance)} m do local.`
                    : `Você está a ${Math.round(distance)} m do local. Aproxime-se para bater o ponto.`;


    // Verifica se pode liberar o botão
    const isButtonDisabled = isGpsLoading && !userLocation; 

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
                    { 
                        color: errorMsg ? theme.colors.error : theme.colors.onSurface,
                        fontFamily: 'Nunito_400Regular'
                    }
                    
                ]}>
                    {statusText}
                </Text>

                <Text style={[styles.clockText, { color: theme.colors.onSurface }]}>
                    {format(currentTime, "HH:mm:ss", { locale: ptBR })}
                </Text>

                <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant, fontFamily: 'Nunito_400Regular' }]}>
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
                                        ? theme.colors.primary
                                        : undefined
                                }
                            },
                            {
                                value: 'SAIDA',
                                label: 'Saída',
                                icon: 'logout', 
                                style: {
                                    backgroundColor: tipoPonto === 'SAIDA'
                                        ? theme.colors.errorContainer 
                                        : undefined
                                }
                            },
                        ]}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { 
                            backgroundColor: isButtonDisabled ? theme.colors.surfaceDisabled : theme.colors.primary,
                            opacity: isButtonDisabled ? 0.6 : 1
                        }
                    ]}
                    onPress={() => setConfirmModelVisible(true)}
                    disabled={isButtonDisabled || loading} // Desabilita se GPS estiver carregando ou API estiver enviando
                >
                    {isButtonDisabled ? (
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <ActivityIndicator size="small" color={theme.colors.onSurfaceDisabled} />
                            <Text style={[styles.buttonText, { color: theme.colors.onSurfaceDisabled }]}>
                                Aguardando GPS...
                            </Text>
                        </View>
                    ) : (
                        <Text style={[
                            styles.buttonText,
                            { color: theme.colors.onPrimary }
                        ]}>
                            Bater Ponto
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            
            <Portal>
                <PaperModal
                    visible={confirmModelVisible}
                    onDismiss={() => setConfirmModelVisible(false)}
                    // O segredo está aqui: Este estilo define a caixa branca/elevada
                    contentContainerStyle={[styles.paperModalContainer, styles.paperModalContainer, 
                        { 
                            backgroundColor: theme.colors.elevation.level3,
                            // AQUI ESTÁ A CORREÇÃO:
                            // Se for Desktop, trava em 600px ou 50% da tela.
                            // Se for Mobile, usa 85% ou 90%.
                            width: isDesktop ? 600 : '85%', 
                            maxWidth: '90%', // Segurança para não estourar telas pequenas
                        }]}
                >
                    <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                        Confirmar Registro
                    </Text>

                    <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10, textAlign: 'center' }}>
                        Você está prestes a registrar um ponto de:
                    </Text>

                    <Text style={[
                        styles.tipoDestaque,
                        {
                            color: tipoPonto === 'ENTRADA' ? theme.colors.primary : theme.colors.error,
                            borderColor: tipoPonto === 'ENTRADA' ? theme.colors.primary : theme.colors.error
                        }
                    ]}>
                        {tipoPonto}
                    </Text>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                            onPress={() => setConfirmModelVisible(false)}
                        >
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                            onPress={() => {
                                setConfirmModelVisible(false);
                                handleBaterPonto();
                            }}
                        >
                            <Text style={{ color: theme.colors.onPrimary, fontFamily: 'Nunito_700Bold' }}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </PaperModal>
            </Portal>

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
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
        }
        return 'rgba(0,0,255,0.12)'; // Fallback azul
    }
    
    // Tratamento para establishmentCoords nulo para evitar crash no mapa
    if(!establishmentCoords) return <View style={styles.map}><Text>Carregando mapa...</Text></View>

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
                pinColor={primaryColor} 
            />
            <Circle
                center={establishmentCoords}
                radius={allowedRadius}
                strokeColor={primaryColor} 
                fillColor={hexToRgba(primaryColor, 0.2)} 
            />
        </MapView>
    );
}

/* ---------- Web Leaflet map component (kept inside same file) ---------- */
function WebLeafletMap({ initialCenter, establishmentCoords, userLocation, allowedRadius }: any) {
    const { MapContainer, TileLayer, Marker, Circle } = WebMapModule;
    const L = require("leaflet");

    const createIcon = (color: string) => {
        return new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],      // Tamanho do ícone
            iconAnchor: [12, 41],    // Ponto do ícone que corresponde à localização (a pontinha de baixo)
            popupAnchor: [1, -34],   // Onde o popup abre em relação ao ícone
            shadowSize: [41, 41]     // Tamanho da sombra
        });
    };

    const usuarioSvgHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 -5 35 45">
            <path fill="#0427f0" stroke="#FFFFFF" stroke-width="-1" d="M16,0C9.373,0,4,5.373,4,12c0,8,12,20,12,20s12-12,12-20C28,5.373,22.627,0,16,0z"/>
            <path fill="#FFFFFF" d="M16,4c-2.209,0-4,1.791-4,4s1.791,4,4,4s4-1.791,4-4S18.209,4,16,4z M16,13c-2.672,0-8,1.336-8,4v3h16v-3C24,14.336,18.672,13,16,13z"/>
        </svg>
    `;

    const empresaIcon = createIcon('blue');  // Empresa Azul (Padrão)
    const usuarioIcon = new L.DivIcon({
        className: 'custom-user-icon', // Necessário para o Leaflet não aplicar estilos padrão de quadrado branco
        html: usuarioSvgHtml,
        iconSize: [80, 80],   // Tamanho do SVG
        iconAnchor: [20, 40], // Ponto que toca o mapa (metade da largura, altura total)
        popupAnchor: [0, -40] // Onde o popup abre acima dele
    });
    // Tratamento de segurança para coordenadas
    const lat = initialCenter?.latitude ?? establishmentCoords?.latitude ?? 0;
    const lng = initialCenter?.longitude ?? establishmentCoords?.longitude ?? 0;

    // Se não tiver coordenadas válidas ainda, mostra loading
    if ((lat === 0 && lng === 0) || !establishmentCoords) {
        return (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p>Obtendo coordenadas...</p>
            </div>
        );
    }

    const mapInitialCenter: [number, number] = [lat, lng];
    const mapInitialZoom = 15;

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <MapContainer
                center={mapInitialCenter}
                zoom={mapInitialZoom}
                style={{ width: "100%", height: "100%" }}
            >
                {/* Nota: Tiles do OSM são sempre claros. Para mudar, precisa de provedor customizado */}
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {establishmentCoords && establishmentCoords.latitude !== 0 && (
                     <>
                        <Marker 
                            position={[establishmentCoords.latitude, establishmentCoords.longitude]} 
                            icon={empresaIcon} // <--- APLICA O ÍCONE AZUL
                        />
                        <Circle center={[establishmentCoords.latitude, establishmentCoords.longitude]} radius={allowedRadius} />
                     </>
                )}
               
                {userLocation && (
                    <Marker 
                        position={[userLocation.coords.latitude, userLocation.coords.longitude]} 
                        icon={usuarioIcon} // <--- APLICA O ÍCONE VERMELHO
                    />
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
        fontFamily: 'Nunito_700Bold'
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
        fontFamily: 'Nunito_700Bold'
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro transparente
    },
    modalContent: {
        width: '85%',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 5, // Sombra no Android
        shadowColor: '#000', // Sombra no iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    paperModalContainer: {
        padding: 24,
        margin: 20,
        borderRadius: 16,
        alignSelf: 'center', // Isso centraliza a caixa no meio da tela no Paper
        alignItems: 'center', // Centraliza o texto e botões dentro da caixa
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Nunito_700Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    tipoDestaque: {
        fontSize: 32,
        fontFamily: "Nunito_700Bold",
        marginVertical: 20,
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderWidth: 3,
        borderRadius: 12,
        letterSpacing: 2,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    }
});