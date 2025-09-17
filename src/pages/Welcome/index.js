import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { contextDeviceId } from '../../../context/contextGlobal/contex';
import axios from 'axios';

import {API_URL} from '@env';

export default function Welcome() {
    const deviceId = useContext(contextDeviceId);
    const navigation = useNavigation();
    const [nome, setNome] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkName = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/usuario/${deviceId}`);
                const routerData = response.data;
                if (routerData && routerData.uuid) {
                    setNome(routerData.nomeCompleto);
                    console.log("Nome:", routerData.nomeCompleto); // Mostre o nome corretamente
                } else {
                    setNome(null);
                }
            } catch (error) {
                console.error("Erro ao buscar nome:", error);
                setNome(null);
            } finally {
                setLoading(false);
            }
        };

        if (deviceId) {
            checkName();
        }
    }, [deviceId]);

    const primeiroNome = nome ? nome.split(' ')[0] : null;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size={24} color="#a31821" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.containerHeader}>
                <Animatable.View animation="fadeInDown" delay={500}>
                    <Image style={styles.logo1} source={require('../imgs/icon.jpeg')} />
                    <Text style={{ color: "#fff", justifyContent: 'center', alignItems: "center", textAlign: "center" }}>v.250225</Text>
                </Animatable.View>
            </View>

            <Animatable.View animation="fadeInUp" style={styles.containerForm}>
                {nome ? (
                    <Text style={styles.title}>Bem-Vindo, {primeiroNome}!</Text> // Exibe o nome se existir
                ) : (
                    <Text style={styles.title}>Bem-Vindo!</Text> // Mensagem padrão se nome não estiver disponível
                )}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate("Ambientes")}
                    >
                        <Text style={styles.buttonText}>Acessar</Text>
                    </TouchableOpacity>
                </View>
                <View>
                    <TouchableOpacity
                        style={styles.buttonSing}
                        onPress={() => navigation.navigate("NovoAmbiente")}
                    >
                        <Text style={styles.textSing}>Solicitar acesso!</Text>
                    </TouchableOpacity>
                </View>
            </Animatable.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#a31821',
    },
    title: {
        fontSize: 24,
        color: 'rgba(163, 24, 33, 1)',
        fontFamily: 'AnonymousPro_700Bold',
    },
    containerHeader: {
        marginTop: '5%',
        marginBottom: '5%',
        display: 'flex',
        alignItems: 'center',
    },
    containerForm: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderTopLeftRadius: 100,
    },
    button: {
        backgroundColor: '#a31821',
        width: 334,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
        borderTopLeftRadius: 100,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 100,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'AnonymousPro_700Bold',
    },
    logo1: {
        width: 200,
        height: 200,
    },
    buttonSing: {
        alignItems: 'center',
    },
    textSing: {
        fontSize: 16,
        color: '#a31821',
        fontFamily: 'AnonymousPro_700Bold',
    }
});
