import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import CustomPicker from './customPicker';
import { contextDeviceId, contextDeviceExists, name } from '../../../context/contextGlobal/contex'; // Aqui adicionei o contextDeviceExists
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { API_URL } from '@env';


export default function SingUp() {
    const deviceId = useContext(contextDeviceId);
    const [isDeviceIdExists, setIsDeviceIdExists] = useContext(contextDeviceExists); // Adicionado para alterar o estado global
    // const [name, setName] = useContext(name); // Adicionado para alterar o estado global
    const navigation = useNavigation();

    const [nomeCompleto, setNomeCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [ambienteSelecionado, setAmbienteSelecionado] = useState(null);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
    const [ambientes, setAmbientes] = useState([]);
    const [perfis, setPerfis] = useState([]);

    const handleAdicionarUsuario = async (deviceId, nomeCompleto, email, ambienteSelecionado, usuarioSelecionado) => {
        try {
            console.log("Ambiente Selecionado:", ambienteSelecionado);

            const responseAmbiente = await axios.get(`${API_URL}/ambiente/nome?nome=${ambienteSelecionado}`);
            const ambienteData = responseAmbiente.data;
            console.log("Ambiente Data:", ambienteData);

            let ambienteId = ambienteData.id;

            if (!ambienteId) {
                throw new Error("Ambiente não encontrado.");
            }

            // Verificar se existem acessos na tabela
            const responseAcessos = await axios.get(`${API_URL}/acesso`);
            const acessos = responseAcessos.data;

            console.log("Retorno de acessos:", acessos);

            // Definir a flag superUser com base no retorno
            const isSuperUser = acessos.length === 0 ? true : false;


            // Inserir o usuário na API
            const usuarioPayload = {
                uuid: deviceId,
                nomeCompleto: nomeCompleto,
                emailUfpe: email,
                superUser: isSuperUser, // Configurando a flag
            };

            const responseUsuario = await axios.post(`${API_URL}/usuario`, usuarioPayload);

            console.log("Resposta do usuário:", responseUsuario);

            const responseAcesso = await axios.post(`${API_URL}/acesso`, {
                usuarioId: deviceId,
                ambienteId: ambienteId,
                ativo: false,
                tipoUsuario: usuarioSelecionado
            });

            console.log("Resposta de acesso:", responseAcesso);

            return { sucesso: true };
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            return { sucesso: false, error };
        }
    };


    const fetchAmbientes = async () => {
        try {
            const response = await axios.get(`${API_URL}/ambiente`);
            setAmbientes(response.data.map(ambiente => ambiente.nome));
        } catch (error) {
            console.error('Erro ao buscar ambientes:', error);
        }
    };

    const fetchPerfis = async () => {
        try {
            const response = await axios.get(`${API_URL}/perfil`);
            setPerfis(response.data.map(perfil => perfil.nome));
        } catch (error) {
            console.error('Erro ao buscar perfis:', error);
        }
    };

    useEffect(() => {
        fetchAmbientes();
        fetchPerfis();
    }, []);

    const onPressButton = async () => {
        if (!nomeCompleto || !email || !ambienteSelecionado || !usuarioSelecionado) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        const { sucesso, error } = await handleAdicionarUsuario(deviceId, nomeCompleto, email, ambienteSelecionado, usuarioSelecionado);
        if (!sucesso) {
            Alert.alert('Erro', 'Houve um erro ao solicitar acesso.');
            console.error(error);
            return;
        }

        // Alterar o valor global de 'isDeviceIdExists' para true após solicitação bem-sucedida
        setIsDeviceIdExists(true);
        console.log("isDeviceIdExists:", true); // Debug da variável

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
                    <Image style={styles.logo1} source={require('../imgs/icon.jpeg')} />
                </Animatable.View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Animatable.View animation="fadeInUp" style={styles.containerForm}>
                    <Text style={styles.title}>Nome completo</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNomeCompleto}
                        value={nomeCompleto}
                    />

                    <Text style={styles.title}>Email</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setEmail}
                        value={email}
                    />

                    <Text style={styles.title}>Selecionar ambiente</Text>
                    <CustomPicker
                        selectedValue={ambienteSelecionado}
                        onValueChange={(value) => setAmbienteSelecionado(value)}
                        items={ambientes}
                        style={styles.input}
                    />

                    <Text style={styles.title}>Selecionar usuário</Text>
                    <CustomPicker
                        selectedValue={usuarioSelecionado}
                        onValueChange={(value) => setUsuarioSelecionado(value)}
                        items={perfis}
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
        display: 'flex',
        alignItems: 'center'
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    containerForm: {
        flex: 1,
        paddingTop: 45,
        backgroundColor: '#FFF',
        alignItems: 'center',
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
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
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
        fontFamily: 'AnonymousPro_700Bold',
        color: '#FFF',
        fontSize: 20,
        paddingVertical: 3
    },
    logo1: {
        width: 200,
        height: 200
    }
});
