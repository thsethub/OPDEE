import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import CustomPicker from "../../../AppConfig/telas/rfid/customPicker";
import { contextDeviceId } from "../../../../../context/contextGlobal/contex";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Client as PahoClient } from "paho-mqtt";
import { API_URL, API_URL2 } from "@env";

const PAGE_SIZE = 20;

export default function NovoAmbiente() {
  const navigation = useNavigation();
  const deviceId = useContext(contextDeviceId);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [broker, setBroker] = useState(null);
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rfid, setRFID] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const searchTimeout = useRef(null);
  const currentFilter = useRef("");

  useEffect(() => {
    loadUsuarios(0, true, "");
  }, []);

  const loadUsuarios = async (p, reset = false, nome = "") => {
    if (p > 0) {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    try {
      const { data } = await axios.get(`${API_URL2}/usuarios`, {
        params: { nome, page: p, size: PAGE_SIZE },
      });
      const novos = Array.isArray(data) ? data : (data?.content ?? []);
      const last = Array.isArray(data) ? true : (data?.last ?? true);
      setUsuarios((prev) => (reset ? novos : [...prev, ...novos]));
      setPage(p);
      setHasMore(!last);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error.message);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  const handleSearch = useCallback((texto) => {
    currentFilter.current = texto;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadUsuarios(0, true, texto.trim());
    }, 400);
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !loadingMoreRef.current) {
      loadUsuarios(page + 1, false, currentFilter.current.trim());
    }
  };

  useEffect(() => {
    const fetchBrokerData = async () => {
      try {
        const response = await axios.get(`${API_URL}/broker`);
        const brokerData = response.data[0];
        console.log("Dados do Broker:", brokerData);
        setBroker(brokerData);
      } catch (error) {
        console.error("Erro ao buscar configuração do broker: ", error);
      }
    };
    fetchBrokerData();
  }, []);

  useEffect(() => {
    if (broker) {
      const mqttClient = new PahoClient(
        broker.ipAdress,
        Number(broker.port),
        `id_ufpe-${parseInt(Math.random() * 100)}`
      );

      mqttClient.onMessageArrived = (message) => {
        console.log("Mensagem recebida:", message.payloadString);
        const payload = JSON.parse(message.payloadString);
        setRFID(payload.Cartao);
      };

      mqttClient.onConnectionLost = (responseObject) => {
        if (responseObject.errorCode !== 0) {
          console.log("Conexão perdida:", responseObject.errorMessage);
          setConnected(false);
        }
      };

      mqttClient.connect({
        onSuccess: () => {
          setConnected(true);
          setClient(mqttClient);
          mqttClient.subscribe("/acesso_cartao");
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

  const associarUsuario = async () => {
    if (selectedUser && rfid) {
      try {
        await axios.put(`${API_URL2}/usuarios/${selectedUser.id}`, {
          UniqueID: Number(rfid),
        });
        Alert.alert(
          "Sucesso",
          `Usuário ${selectedUser.Nome} associado ao código RFID ${rfid}`,
          [
            {
              text: "OK",
              onPress: () => {
                setSelectedUser(null);
                setRFID("");
              },
            },
          ]
        );
      } catch (error) {
        console.error("Erro ao associar usuário:", error);
        Alert.alert("Erro", "Falha ao associar usuário.");
      }
    } else {
      Alert.alert("Erro", "Por favor, selecione um usuário e receba um código RFID.");
    }
  };

  const confirmarAssociacao = () => {
    if (selectedUser && rfid) {
      Alert.alert(
        "Confirmação",
        `Tem certeza que deseja associar o usuário ${selectedUser.Nome} ao código RFID ${rfid}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: associarUsuario },
        ]
      );
    } else {
      Alert.alert("Erro", "Por favor, selecione um usuário e receba um código RFID.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image
            style={styles.logo1}
            source={require("../../../imgs/icon.jpeg")}
          />
        </Animatable.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animatable.View animation="fadeInUp" style={styles.containerForm}>
          <Text style={styles.title}>Selecionar usuário</Text>
          <CustomPicker
            selectedValue={selectedUser}
            onValueChange={(value) => setSelectedUser(value)}
            items={usuarios}
            style={styles.input}
            placeholder="Selecione um usuário"
            onSearch={handleSearch}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
          />
          <Text style={styles.title}>Código RFID</Text>
          <View style={styles.input}>
            <Text style={styles.mensagem}>{rfid}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={confirmarAssociacao}>
            <Text style={styles.buttonText}>Associar</Text>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a31821",
  },
  containerHeader: {
    marginTop: "10%",
    marginBottom: "10%",
    display: "flex",
    alignItems: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  containerForm: {
    flex: 1,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 100,
    borderTopRightRadius: 0,
  },
  title: {
    fontSize: 18,
    fontFamily: "AnonymousPro_700Bold",
    display: "flex",
    alignItems: "center",
    color: "rgba(0, 0, 0, 0.61)",
    alignSelf: "flex-start",
    paddingLeft: "15%",
    marginTop: 15,
  },
  input: {
    width: 334,
    height: 54,
    fontFamily: "AnonymousPro_400Regular",
    backgroundColor: "#FFF",
    color: "rgba(0, 0, 0, 0.61)",
    justifyContent: "center",
    paddingLeft: 28,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 100,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  button: {
    backgroundColor: "#a31821",
    width: 334,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    marginBottom: 5,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 100,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "AnonymousPro_700Bold",
    paddingVertical: 3,
  },
  logo1: {
    height: 200,
    width: 200,
  },
  mensagem: {
    fontSize: 16,
    fontFamily: "AnonymousPro_400Regular",
    color: "rgba(0, 0, 0, 0.61)",
    marginTop: 10,
  },
});
