import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Animatable from "react-native-animatable";
import axios from "axios";
import { API_URL2 } from '@env';

export default function Config6() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL2}/usuarios`);
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
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
            <View style={styles.divider} />
            <Text style={styles.text}>Crachá de Usuários</Text>
          </View>
        </Animatable.View>
      </View>
      <ScrollView style={styles.scrollViewContent}>
        <Animatable.View animation="fadeInUp" style={styles.containerForm}>
          <TextInput
            style={styles.input}
            placeholder="Filtrar por Nome ou CPF"
            placeholderTextColor="#999"
            value={filter}
            onChangeText={setFilter}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#a31821" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter ? "Nenhum resultado para a busca." : "Nenhum usuário cadastrado."}
              </Text>
            </View>
          ) : (
            filteredUsers.map((item) => (
              <View key={item.CPF} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardNome}>{item.Nome}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.Acesso === 1 ? "#e8f5e9" : "#fbe9e7",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            item.Acesso === 1 ? "#2ecc71" : "#e74c3c",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            item.Acesso === 1 ? "#2e7d32" : "#c62828",
                        },
                      ]}
                    >
                      {item.Acesso === 1 ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>CPF</Text>
                    <Text style={styles.cardValue}>{item.CPF}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>RFID</Text>
                    <Text style={styles.cardRfid}>
                      {item.UniqueID || "Não atribuído"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  containerForm: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
  },
  logo1: {
    width: 200,
    height: 200,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFF",
    width: "100%",
    position: "absolute",
  },
  text: {
    color: "white",
    fontSize: 18,
    fontFamily: "AnonymousPro_700Bold",
  },
  input: {
    height: 44,
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 14,
    backgroundColor: "#f9f9f9",
    color: "#333",
    fontSize: 14,
    fontFamily: "AnonymousPro_400Regular",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888",
    fontFamily: "AnonymousPro_400Regular",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    fontFamily: "AnonymousPro_400Regular",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#a31821",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardNome: {
    fontSize: 15,
    color: "#222",
    fontFamily: "AnonymousPro_700Bold",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: "AnonymousPro_700Bold",
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: "#999",
    fontFamily: "AnonymousPro_700Bold",
  },
  cardValue: {
    fontSize: 13,
    color: "#444",
    fontFamily: "AnonymousPro_400Regular",
  },
  cardRfid: {
    fontSize: 12,
    color: "#a31821",
    fontFamily: "AnonymousPro_700Bold",
    letterSpacing: 1,
  },
});
