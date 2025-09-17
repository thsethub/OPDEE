import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, Image, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import {API_URL} from '@env';



const Config2 = () => {
    const [broker, setBroker] = useState(null);
    const [updatedBroker, setUpdatedBroker] = useState({
        ipAdress: '',
        port: '',
        username: '',
        password: '',
    });
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const fetchBrokerData = async () => {
            try {
                const response = await axios.get(`${API_URL}/broker`); // URL da sua API
                const brokerData = response.data[0];
                console.log("Dados do Broker:", brokerData);
                setBroker(brokerData);
                setUpdatedBroker(brokerData);
                console.log("Broker:", updatedBroker);
            } catch (error) {
                console.error("Erro ao buscar configuração do broker: ", error);
            }
        };

        fetchBrokerData();
    }, []);

    // useEffect(() => {
    //     if (broker) {
    //         const mqttClient = new Paho.Client(
    //             broker.ipAdress,
    //             Number(broker.port),
    //             `id_ufpe-${parseInt(Math.random() * 100)}`
    //         );

    //         mqttClient.connect({
    //             onSuccess: () => {
    //                 setConnected(true);
    //                 setClient(mqttClient);
    //                 console.log("Conectado com sucesso!");
    //             },
    //             onFailure: (error) => console.error("Falha ao conectar!", error),
    //             userName: broker.username,
    //             password: broker.password
    //         });

    //         return () => {
    //             if (mqttClient.isConnected()) mqttClient.disconnect();
    //         };
    //     }
    // }, [broker]);

    const handleUpdateBroker = async () => {
        Alert.alert(
            'Atualizar configuração do Broker',
            'Tem certeza que deseja alterar as configurações do Broker?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Sim',
                    onPress: async () => {
                        try{
                            const response = await axios.put(`${API_URL}/broker/${broker.id}`, updatedBroker);
                            Alert.alert('Sucesso', 'Configuração do Broker atualizada com sucesso!');
                        }
                        catch(error){
                            console.error("Erro ao atualizar configuração do Broker:", error);
                            Alert.alert('Erro', 'Erro ao atualizar configuração do Broker. Tente novamente mais tarde.');
                        }
                    }
                }
            ]
        );
    };

    const handleChangeText = (key, value) => {
        setUpdatedBroker(prevState => ({
            ...prevState,
            [key]: key === 'port' ? (isNaN(Number(value)) ? '' : Number(value)) : value, // Trata 'port' como número, mas mantém os outros campos como strings
        }));
    };

    return (
        <SafeAreaView style={styles.container} >
            <View style={styles.containerHeader}>
                <Animatable.View animation="fadeInDown" delay={500}>
                    <Image style={styles.logo1} source={require("../../imgs/icon.jpeg")} />
                </Animatable.View>
                <Animatable.View animation="fadeInDown" delay={500}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <View style={[styles.divider]} />
                        <Text style={styles.text}>Configurações de Broker</Text>
                    </View>
                </Animatable.View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Animatable.View animation="fadeInUp" style={styles.containerForm}>
                    <View style={styles.containerConfig}>
                        <TextInput
                            placeholder="IP Address"
                            value={updatedBroker.ipAdress}
                            onChangeText={text => handleChangeText('ipAdress', text)}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Port"
                            value={updatedBroker.port}
                            onChangeText={text => handleChangeText('port', text)}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Username"
                            value={updatedBroker.username}
                            onChangeText={text => handleChangeText('username', text)}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Password"
                            value={updatedBroker.password}
                            onChangeText={text => handleChangeText('password', text)}
                            style={styles.input}
                            secureTextEntry
                        />
                        {/* Botão para atualizar as informações do broker */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleUpdateBroker}
                        >
                            <Text style={styles.buttonText}>Atualizar Broker</Text>
                        </TouchableOpacity>
                    </View>
                </Animatable.View>
            </ScrollView>
        </SafeAreaView >
    );
};

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
        justifyContent: 'center',
    },
    containerForm: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        // justifyContent: 'center',
        borderTopRightRadius: 0,
        padding: 20
    },
    button: {
        backgroundColor: '#a31821',
        width: 334,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
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
        fontSize: 18,
        fontFamily: 'AnonymousPro_700Bold',
    },
    input: {
        width: 334,
        height: 54,
        fontFamily: 'AnonymousPro_400Regular',
        backgroundColor: '#FFF',
        color: 'rgba(0, 0, 0, 0.61)',
        justifyContent: 'center',
        paddingLeft: 28,
        marginTop: 15,
        borderTopLeftRadius: 100,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 100,
        shadowColor: '#000',
        shadowOpacity: 0.50,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
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
});


export default Config2;