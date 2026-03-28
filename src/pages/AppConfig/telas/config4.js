import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, Text, Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import {API_URL} from '@env';


export default function HistoricoAcessos() {
    const [historico, setHistorico] = useState([]);

    const fetchHistorico = async () => {
        try {
            const response = await axios.get(`${API_URL}/historico`);
            const sortedData = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            setHistorico(sortedData);
            console.log("Histórico de acessos:", sortedData);
        } catch (error) {
            console.error("Erro ao buscar histórico de acessos:", error);
        }
    }


    useEffect(() => {
        fetchHistorico();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.containerHeader}>
                <Animatable.View animation="fadeInDown" delay={500}>
                    <Image style={styles.logo1} source={require('../../imgs/icon.jpeg')} />
                </Animatable.View>
                <Animatable.View animation="fadeInDown" delay={500}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <View style={[styles.divider]} />
                        <Text style={styles.text}>Histórico de Acessos</Text>
                    </View>
                </Animatable.View>
            </View>
            <ScrollView style={styles.scrollViewContent}>
                <Animatable.View animation="fadeInUp" style={styles.containerForm}>
                    {historico.map((item) => (
                        <View key={item.id} style={styles.historicoContainer}>
                            <Text style={styles.historicoText}>Nome: {item.nomeCompleto}</Text>
                            <Text style={styles.historicoText}>Perfil: {item.nomePerfil}</Text>
                            <Text style={styles.historicoText}>Ambiente: {item.nomeAmbiente}</Text>
                            <Text style={styles.historicoText}>Mensagem: {item.mensagem}</Text>
                            <Text style={styles.historicoText}>Data: {new Date(item.createdAt).toLocaleString()}</Text>
                        </View>
                    ))}
                </Animatable.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#a31821',
    },
    containerHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    containerForm: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        borderTopRightRadius: 0,
        padding: 20,
    },
    logo1: {
        width: 200,
        height: 200,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#FFF',
        width: '300%',
        position: 'absolute',
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'AnonymousPro_700Bold',
    },
    historicoContainer: {
        marginVertical: 10,
        paddingHorizontal: 10,
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 10,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 5,
    },
    historicoText: {
        fontSize: 16,
        color: 'rgba(0, 0, 0, 0.61)',
        fontFamily: 'AnonymousPro_400Regular',
        marginTop: 3,
    },
});
