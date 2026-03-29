import Paho from "paho-mqtt";
import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { contextDeviceId } from "../../../context/contextGlobal/contex";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

import { API_URL } from "@env";

export default function Ambientes() {
  const deviceId = useContext(contextDeviceId);
  const navigation = useNavigation();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [ambientes, setAmbientes] = useState([]);
  const [isSuperusuario, setIsSuperusuario] = useState(null);
  const [newEmail, setNewEmail] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parte OK
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [brokerResponse, usuarioResponse, acessoResponse] =
          await Promise.all([
            axios.get(`${API_URL}/broker`),
            axios.get(`${API_URL}/usuario/${deviceId}`),
            axios.get(`${API_URL}/acesso/${deviceId}`),
          ]);

        console.log("Dados do Broker:", brokerResponse.data[0]);
        console.log("Dados do Usuario:", usuarioResponse.data);
        console.log("Dados de ambientes do usuario:", acessoResponse.data);

        setBroker(brokerResponse.data[0]);
        setUsuario(usuarioResponse.data);
        setIsSuperusuario(usuarioResponse.data.superUser);
        setNewEmail(usuarioResponse.data.emailUfpe);
        setAmbientes(acessoResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        console.error("API_URL:", API_URL);
        console.error("DeviceID:", deviceId);
        setError(`Erro ao conectar com API: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      fetchInitialData();
    }
  }, [deviceId]);

  // Conectar MQTT depois que broker estiver disponível
  useEffect(() => {
    if (broker) {
      const mqttClient = new Paho.Client(
        broker.ipAdress,
        Number(broker.port),
        `id_ufpe-${parseInt(Math.random() * 100)}`,
      );

      mqttClient.connect({
        onSuccess: () => {
          setConnected(true);
          setClient(mqttClient);
          console.log("Conectado com sucesso!");
        },
        onFailure: (error) => console.error("Falha ao conectar!", error),
        userName: broker.username,
        password: broker.password,
      });

      return () => {
        if (mqttClient.isConnected()) mqttClient.disconnect();
      };
    }
  }, [broker]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#a31821",
        }}
      >
        <ActivityIndicator size={32} color="#FFF" />
        <Text
          style={{
            color: "#FFF",
            marginTop: 10,
            fontFamily: "AnonymousPro_700Bold",
          }}
        >
          Carregando...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#a31821",
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 16,
            textAlign: "center",
            fontFamily: "AnonymousPro_700Bold",
            marginBottom: 20,
          }}
        >
          Erro!
        </Text>
        <Text
          style={{
            color: "#FFF",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: "#FFF",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 5,
          }}
        >
          <Text
            style={{ color: "#a31821", fontFamily: "AnonymousPro_700Bold" }}
          >
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const registerMessage = async (ambiente, message, id) => {
    console.log("User:", id);
    try {
      const response = await axios.post(`${API_URL}/historico`, {
        usuarioId: deviceId,
        perfilId: id,
        ambienteId: ambiente.ambienteId,
        mensagem: message,
      });
      // console.log("Mensagem registrada com sucesso: ", response);
    } catch (error) {
      console.error("Erro ao registrar mensagem: ", error);
    }
  };

  const handlerPress = async (ambienteId, ambienteUser) => {
    console.log("Ambiente User:", ambienteUser);
    const perfilId = await axios.get(`${API_URL}/perfil/nome/${ambienteUser}`);
    console.log("Perfil ID:", perfilId.data.id);
    const ambiente = ambientes.find((a) => a.ambienteId === ambienteId);
    if (!ambiente) {
      Alert.alert("Erro", "Ambiente não encontrado.");
      return;
    }

    try {
      if (connected && ambiente.ativo) {
        Alert.alert(
          "Confirmação",
          `Tem certeza que deseja abrir o ambiente ${ambiente.nomeAmbiente}?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Confirmar",
              onPress: async () => {
                try {
                  const mqttMessage = new Paho.Message(ambiente.mensagem);
                  mqttMessage.destinationName = ambiente.topic;
                  client.subscribe("ambientes");
                  await client.send(mqttMessage);
                  await registerMessage(
                    ambiente,
                    ambiente.mensagem,
                    perfilId.data.id,
                  );
                } catch (error) {
                  Alert.alert(
                    "Erro",
                    `Falha ao enviar mensagem: ${error.message}`,
                  );
                }
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          "Acesso negado",
          "Você não tem permissão para acessar este ambiente ou não está conectado.",
        );
      }
    } catch (error) {
      console.error("Erro ao buscar o perfil do usuário:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image style={styles.logo1} source={require("../imgs/icon.jpeg")} />
        </Animatable.View>
        <Animatable.View animation="fadeInDown" delay={500}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 6,
              width: "100%",
            }}
          >
            <FontAwesome name="user" size={24} color="white" />
            <View style={[styles.divider]} />
            <Text style={styles.text}>{newEmail}</Text>
            {isSuperusuario && (
              <TouchableOpacity
                onPress={() => navigation.navigate("AppConfig")}
              >
                <Ionicons name="settings-sharp" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                if (client.isConnected()) {
                  client.disconnect();
                }
                navigation.navigate("Welcome");
              }}
            >
              <Ionicons name="exit-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollView}
      >
        <Animatable.View animation="fadeInUp" style={styles.containerForm}>
          {ambientes.map((ambiente) => (
            <View style={styles.buttonContainer} key={ambiente.ambienteId}>
              <TouchableOpacity
                style={[
                  styles.button,
                  !ambiente.ativo && styles.buttonDisabled,
                ]}
                onPress={() =>
                  handlerPress(ambiente.ambienteId, ambiente.tipoUsuario)
                }
                disabled={!ambiente.ativo}
              >
                <Text style={styles.buttonText}>{ambiente.nomeAmbiente}</Text>
              </TouchableOpacity>
              {(isSuperusuario ||
                (ambiente.tipoUsuario === "Coordenador" && ambiente.ativo)) && (
                <TouchableOpacity
                  style={styles.buttonConfig}
                  onPress={() =>
                    navigation.navigate("ControleAcesso", {
                      ambienteId: ambiente.ambienteId,
                    })
                  }
                >
                  <Ionicons name="settings-sharp" size={30} color="#a31821" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a31821",
  },
  containerHeader: {
    display: "flex",
    alignItems: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFF",
    width: "150%",
    position: "absolute",
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  containerForm: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  button: {
    backgroundColor: "#a31821",
    width: 300,
    height: 54,
    marginTop: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 100,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#cdcdcd",
  },
  buttonContainer: {
    flexDirection: "row",
  },
  buttonConfig: {
    backgroundColor: "#fff",
    width: 70,
    height: 54,
    marginTop: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 200,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "AnonymousPro_700Bold",
  },
  logo1: {
    width: 200,
    height: 170,
  },
  text: {
    fontSize: 16,
    display: "flex",
    fontFamily: "AnonymousPro_700Bold",
    color: "#FFF",
    marginTop: 3,
  },
  scrollView: {
    width: "100%",
  },
});
