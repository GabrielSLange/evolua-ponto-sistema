import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Modal, Portal, IconButton, Chip, Divider, ActivityIndicator, Avatar, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Circle } from 'leaflet';

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
// --- SUB-COMPONENTES DE MAPA WEB ---

// 1. Atualizamos o MapUpdater para receber as coordenadas e Mover a câmera
function MapUpdater({ center }: { center: [number, number] }) {
    if (!WebMapModule) return null;
    const { useMap } = WebMapModule;
    const map = useMap();

    useEffect(() => {
        if (map) {
            // Passo 1: Garante que o tamanho da div está correto (corrige tela cinza)
            map.invalidateSize();
            
            // Passo 2: Força o mapa a voar para a nova coordenada (corrige o bug de local fixo)
            // O animate: true deixa o movimento suave
            map.setView(center, 15, { animate: true });
        }
    }, [map, center]); // Executa sempre que o "center" mudar

    return null;
}

function WebMapComponent({ ponto, estabelecimento }: any) {
    if (!WebMapModule) return <ActivityIndicator />;
    const { MapContainer, TileLayer, Marker, Popup, Circle } = WebMapModule;
    const L = require("leaflet");
    // --- ÍCONES PERSONALIZADOS (Para você ver a diferença) ---
    
    // Ícone Azul (Empresa)
    const empresaIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Ícone Vermelho com Silhueta (Usuário/Ponto)
    const usuarioSvgHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 -5 35 45">
            <path fill="#db2d2d" stroke="#FFFFFF" stroke-width="1" d="M16,0C9.373,0,4,5.373,4,12c0,8,12,20,12,20s12-12,12-20C28,5.373,22.627,0,16,0z"/>
            <path fill="#FFFFFF" d="M16,4c-2.209,0-4,1.791-4,4s1.791,4,4,4s4-1.791,4-4S18.209,4,16,4z M16,13c-2.672,0-8,1.336-8,4v3h16v-3C24,14.336,18.672,13,16,13z"/>
        </svg>
    `;
    const usuarioIcon = new L.DivIcon({
        className: 'custom-user-icon',
        html: usuarioSvgHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    const centerCoords: [number, number] = [ponto.latitude, ponto.longitude];

    return (
        <MapContainer 
            center={centerCoords} 
            zoom={15} 
            style={{ height: '300px', width: '100%', borderRadius: '12px' }} 
        >
            {/* Passamos as coordenadas para o Updater forçar a movimentação */}
            <MapUpdater center={centerCoords} />
            
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            
            {/* Marcador do PONTO (Vermelho) */}
            <Marker position={[ponto.latitude, ponto.longitude]} icon={usuarioIcon}>
                <Popup>
                    <b>Ponto Batido</b><br/>
                    {format(new Date(ponto.timestampMarcacao), "HH:mm")}
                </Popup>
            </Marker>

            {/* Marcador da EMPRESA (Azul) - Só renderiza se tiver latitude */}
            {estabelecimento?.latitude && (
                <>
                    <Marker position={[estabelecimento.latitude, estabelecimento.longitude]} icon={empresaIcon}>
                        <Popup><b>Empresa</b><br/>Sede</Popup>
                    </Marker>
                    <Circle center={[estabelecimento.latitude, estabelecimento.longitude]} radius={(estabelecimento.raioKm !== null) ? estabelecimento.raioKm : 1000} />
                </>
            )}
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