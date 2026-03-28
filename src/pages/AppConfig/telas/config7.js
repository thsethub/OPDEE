import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
  TextInput,
} from "react-native";
import * as Animatable from "react-native-animatable";
import axios from "axios";
import { API_URL2 } from '@env';

export default function Config6() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL2}/usuarios`);
      setUsers(response.data);
      console.log("Usuarios:", users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.Nome.toLowerCase().includes(filter.toLowerCase()) ||
      user.CPF.toString().includes(filter)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image
            style={styles.logo1}
            source={require("../../imgs/icon.jpeg")}
          />
        </Animatable.View>
        <Animatable.View animation="fadeInDown" delay={500}>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <View style={[styles.divider]} />
            <Text style={styles.text}>Crachá de Usuários</Text>
          </View>
        </Animatable.View>
      </View>
      <ScrollView style={styles.scrollViewContent}>
        <Animatable.View animation="fadeInUp" style={styles.containerForm}>
          <TextInput
            style={styles.input}
            placeholder="Filtrar por Nome ou CPF"
            value={filter}
            onChangeText={setFilter}
          />
          {filteredUsers.map((item) => (
            <View key={item.CPF} style={styles.historicoContainer}>
              <Text style={styles.historicoText}>CPF: {item.CPF}</Text>
              <Text style={styles.historicoText}>Nome: {item.Nome}</Text>
              <Text style={styles.historicoText}>
                Status Crachá: {item.Acesso === 1 ? "Ativo" : "Inativo"}
              </Text>
              <Text style={styles.historicoText}>
                Código RFID: {item.UniqueID}
              </Text>
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
    backgroundColor: "#a31821",
  },
  containerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    height: "100%",
  },
  containerForm: {
    flex: 1,
    height: "100%",
    backgroundColor: "#FFF",
    alignItems: "center",
    borderTopRightRadius: 0,
    padding: 20,
  },
  logo1: {
    width: 200,
    height: 200,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFF",
    width: "300%",
    position: "absolute",
  },
  text: {
    color: "white",
    fontSize: 18,
    fontFamily: "AnonymousPro_700Bold",
  },
  input: {
    height: 40,
    width: "100%",
    borderColor: "#a31821",
    borderWidth: 1,
    borderRadius: 5,
    margin: 10,
    paddingLeft: 10,
    backgroundColor: "#FFF",
    color: "rgba(0, 0, 0, 0.61)",
  },
  historicoContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingVertical: 10,
    shadowColor: "#000",
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
    color: "rgba(0, 0, 0, 0.61)",
    fontFamily: "AnonymousPro_400Regular",
    marginTop: 3,
  },
});
