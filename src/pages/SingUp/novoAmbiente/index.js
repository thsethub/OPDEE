import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import CustomPicker from '../customPicker';
import { contextDeviceId } from '../../../../context/contextGlobal/contex';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {API_URL} from '@env';



export default function NovoAmbiente() {
    const navigation = useNavigation();
    const deviceId = useContext(contextDeviceId);

    const [selectedAmbiente, setSelectedAmbiente] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [ambientesB, setAmbientes] = useState([]);
    const [perfil, setPerfil] = useState([]);
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [usuario, setUsuario] = useState('');
    const [ambientes2, setAmbientes2] = useState([]);
    const [ambienteExistente, setAmbienteExistente] = useState(false);

    const fetchAmbientes = async () => {
        try {
            const response = await axios.get(`${API_URL}/ambiente`);
            setAmbientes(response.data.map(ambiente => ambiente.nome));
        } catch (error) {
            console.error('Erro ao buscar ambientes:', error);
        }
    };

    const fetchPerfil = async () => {
        try {
            const response = await axios.get(`${API_URL}/perfil`);
            setPerfil(response.data.map(perfil => perfil.nome));
        } catch (error) {
            console.error('Erro ao buscar perfis:', error);
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${API_URL}/usuario/${deviceId}`);
            const userData = response.data;
            setUsuario(userData);
            setNomeCompleto(userData.nomeCompleto);
            setEmail(userData.emailUfpe);
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
        }
    }

    useEffect(() => {
        fetchAmbientes();
        fetchPerfil();
        fetchUserData();
    }, []);

    const handleAdicionarUsuario = async (deviceId, selectedAmbiente, selectedUser) => {
        try {
            console.log("Ambiente Selecionado:", selectedAmbiente);

            // Busca o ambiente pelo nome
            const responseAmbiente = await axios.get(`${API_URL}/ambiente/nome?nome=${selectedAmbiente}`);
            const ambienteData = responseAmbiente.data;
            console.log("Ambiente Data:", ambienteData);

            let ambienteId = ambienteData.id;

            if (!ambienteId) {
                throw new Error("Ambiente não encontrado.");
            }

            // Busca os ambientes já solicitados pelo usuário
            const responseAmbiente2 = await axios.get(`${API_URL}/acesso/${deviceId}`);
            const ambienteData2 = responseAmbiente2.data;

            // Verifica se o ambiente já foi solicitado
            const ambienteExistente = ambienteData2.find(a => a.ambienteId === ambienteId);

            if (ambienteExistente) {
                // Ambiente já solicitado, exibe uma mensagem de erro
                setAmbienteExistente(true);
                throw new Error("Você já solicitou este ambiente.");
            }

            // Caso não tenha sido solicitado, faz a requisição de acesso
            const responseAcesso = await axios.post(`${API_URL}/acesso`, {
                usuarioId: deviceId,
                ambienteId: ambienteId,
                ativo: false,
                tipoUsuario: selectedUser
            });

            console.log("Resposta de acesso:", responseAcesso);

            return { sucesso: true };
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            return { sucesso: false, error };
        }
    };



    const onPressButton = async () => {
        if (!selectedAmbiente || !selectedUser) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        const { sucesso, error } = await handleAdicionarUsuario(deviceId, selectedAmbiente, selectedUser);
        
        if (!sucesso) {
            if(ambienteExistente){
                Alert.alert('Erro', 'Você já solicitou este ambiente.');
                return;
            }
            Alert.alert('Erro', 'Houve um erro ao solicitar acesso.');
            console.error(error);
            return;
        }

        Alert.alert(
            'Solicitação',
            'A solicitação foi feita com sucesso!',
            [{ text: 'OK', onPress: () => navigation.navigate("Welcome") }], // Navegar para a tela "Welcome"
            { cancelable: false }
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.containerHeader}>
                <Animatable.View animation="fadeInDown" delay={500}>
                    <Image style={styles.logo1} source={require('../../imgs/icon.jpeg')} />
                </Animatable.View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Animatable.View animation="fadeInUp" style={styles.containerForm}>
                    <Text style={styles.title}>Selecionar ambiente</Text>
                    <CustomPicker
                        selectedValue={selectedAmbiente}
                        onValueChange={(value) => setSelectedAmbiente(value)}
                        items={ambientesB}
                        style={styles.input}
                    />
                    <Text style={styles.title}>Selecionar usuário</Text>
                    <CustomPicker
                        selectedValue={selectedUser}
                        onValueChange={(value) => setSelectedUser(value)}
                        items={perfil}
                        style={styles.input}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onPressButton}
                    >
                        <Text style={styles.buttonText}>Solicitar Acesso</Text>
                    </TouchableOpacity>
                </Animatable.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#a31821'
    },
    containerHeader: {
        marginTop: '10%',
        marginBottom: '10%',
        display: 'flex',
        alignItems: 'center'
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    containerForm: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 0,
    },
    title: {
        fontSize: 18,
        fontFamily: 'AnonymousPro_700Bold',
        display: 'flex',
        alignItems: 'center',
        color: 'rgba(0, 0, 0, 0.61)',
        alignSelf: 'flex-start',
        paddingLeft: '15%',
        marginTop: 15,
    },
    input: {
        width: 334,
        height: 54,
        fontFamily: 'AnonymousPro_400Regular',
        backgroundColor: '#FFF',
        color: 'rgba(0, 0, 0, 0.61)',
        justifyContent: 'center',
        paddingLeft: 28,
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
    button: {
        backgroundColor: '#a31821',
        width: 334,
        height: 54,
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        marginBottom: 5,
        borderTopLeftRadius: 100,
        borderTopRightRadius: 0,
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
        fontSize: 20,
        fontFamily: 'AnonymousPro_700Bold',
        paddingVertical: 3
    },
    logo1: {
        height: 200,
        width: 200
    }
});
