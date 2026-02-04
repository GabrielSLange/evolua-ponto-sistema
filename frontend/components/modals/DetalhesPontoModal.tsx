import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Modal, Portal, IconButton, Chip, Divider, ActivityIndicator, Avatar, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- LÓGICA DE MAPAS (WEB & MOBILE) ---
let WebMapModule: any = null;

if (Platform.OS === 'web') {
    try {
        if (typeof document !== "undefined") {
            const id = "leaflet-css-cdn";
            if (!document.getElementById(id)) {
                const link = document.createElement("link");
                link.id = id;
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
        }
        WebMapModule = require("react-leaflet");
        const L = require("leaflet");

        if (L) {
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
        }
    } catch (e) { console.warn("Erro ao carregar Leaflet", e); }
}

// --- PROPS DO COMPONENTE ---
interface DetalhesPontoModalProps {
    visible: boolean;
    onDismiss: () => void;
    ponto: any; // Use a tipagem correta do seu model se tiver
    estabelecimento?: any;
}

export default function DetalhesPontoModal({ visible, onDismiss, ponto, estabelecimento }: DetalhesPontoModalProps) {
    const theme = useTheme();

    if (!ponto) return null;

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
            >
                <View style={{ flex: 1 }}>
                    {/* Cabeçalho */}
                    <View style={[styles.modalHeader, { borderColor: theme.colors.outlineVariant }]}>
                        <View>
                            <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                Detalhes do Ponto
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                {format(new Date(ponto.timestampMarcacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </Text>
                        </View>
                        <IconButton icon="close" onPress={onDismiss} />
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        <View style={{ padding: 20 }}>
                            {/* Linha 1: Funcionário */}
                            <View style={styles.detailRow}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Funcionário</Text>
                                    <Text variant="bodyLarge">{ponto.funcionarioNome}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Cargo</Text>
                                    <Text variant="bodyLarge">{ponto.funcionarioCargo}</Text>
                                </View>
                            </View>

                            {/* Linha 2: Horário e Tipo */}
                            <View style={[styles.detailRow, { marginTop: 15 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Horário</Text>
                                    <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                                        {format(new Date(ponto.timestampMarcacao), "HH:mm:ss")}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Tipo</Text>
                                    <Chip 
                                        icon={ponto.tipo === 'ENTRADA' ? "login" : "logout"} 
                                        style={{ backgroundColor: ponto.tipo === 'ENTRADA' ? theme.colors.primaryContainer : theme.colors.errorContainer, alignSelf: 'flex-start', marginTop: 5 }}
                                    >
                                        {ponto.tipo}
                                    </Chip>
                                </View>
                            </View>

                            <Divider style={{ marginVertical: 20 }} />

                            <Text variant="titleMedium" style={{ marginBottom: 10 }}>Localização</Text>
                            
                            {/* Container do Mapa */}
                            <View style={styles.mapContainer}>
                                {ponto.latitude && ponto.longitude ? (
                                    Platform.OS === 'web' ? (
                                        <WebMapComponent 
                                            key={ponto.id} // Força recriar o mapa ao mudar o ponto
                                            ponto={ponto} 
                                            estabelecimento={estabelecimento} 
                                        />
                                    ) : (
                                        <NativeMapComponent 
                                            ponto={ponto} 
                                            estabelecimento={estabelecimento}
                                        />
                                    )
                                ) : (
                                    <View style={styles.noLocationContainer}>
                                        <Avatar.Icon size={64} icon="map-marker-off" style={{ backgroundColor: theme.colors.surfaceVariant }} />
                                        <Text style={{ marginTop: 10, color: theme.colors.outline }}>Localização não registrada.</Text>
                                    </View>
                                )}
                            </View>
                            
                            {ponto.latitude && (
                                <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 10 }}>
                                    Precisão: {ponto.precisaoMetros ? `${ponto.precisaoMetros.toFixed(1)} m` : 'Desconhecida'}
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </Portal>
    );
}

// --- SUB-COMPONENTES DE MAPA (WEB & NATIVE) ---

function NativeMapComponent({ ponto, estabelecimento }: any) {
    let MapView: any, Marker: any;
    try {
        const RNM = eval("require")("react-native-maps");
        MapView = RNM.default ?? RNM;
        Marker = RNM.Marker;
    } catch { return <Text>Erro: react-native-maps não instalado.</Text>; }

    const initialRegion = {
        latitude: ponto.latitude,
        longitude: ponto.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    };

    return (
        <MapView style={{ width: '100%', height: '100%' }} initialRegion={initialRegion}>
            <Marker coordinate={{ latitude: ponto.latitude, longitude: ponto.longitude }} title="Ponto Batido" pinColor={ponto.tipo === 'ENTRADA' ? 'green' : 'red'} />
            {estabelecimento?.latitude && <Marker coordinate={{ latitude: estabelecimento.latitude, longitude: estabelecimento.longitude }} title="Empresa" pinColor="blue" />}
        </MapView>
    );
}

// "Vigilante" para Web: Garante que o mapa renderize após o modal abrir
function MapUpdater() {
    if (!WebMapModule) return null;
    const { useMap } = WebMapModule;
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize(); 
        }, 250); // Delay para esperar a animação do Modal
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function WebMapComponent({ ponto, estabelecimento }: any) {
    if (!WebMapModule) return <ActivityIndicator />;
    const { MapContainer, TileLayer, Marker, Popup } = WebMapModule;

    return (
        <MapContainer 
            center={[ponto.latitude, ponto.longitude]} 
            zoom={15} 
            style={{ height: '300px', width: '100%', borderRadius: '12px' }} 
        >
            <MapUpdater />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <Marker position={[ponto.latitude, ponto.longitude]}><Popup><b>Ponto Batido</b><br/>{format(new Date(ponto.timestampMarcacao), "HH:mm")}</Popup></Marker>
            {estabelecimento?.latitude && <Marker position={[estabelecimento.latitude, estabelecimento.longitude]}><Popup><b>Empresa</b><br/>Sede</Popup></Marker>}
        </MapContainer>
    );
}

const styles = StyleSheet.create({
    modalContent: { 
        padding: 0, 
        margin: 20, 
        borderRadius: 12, 
        alignSelf: 'center', 
        width: '90%', 
        maxWidth: 600, 
        overflow: 'hidden', 
        height: '80%', 
        maxHeight: 700 
    },
    modalHeader: { 
        padding: 20, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottomWidth: 1 
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    mapContainer: { height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 10, backgroundColor: '#e0e0e0' },
    noLocationContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }
});