import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import axios from "axios";
import { API_URL2 } from "@env";

const PAGE_SIZE = 20;

export default function Config6() {
  const [usuarios, setUsuarios] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const filterTimeout = useRef(null);

  useEffect(() => {
    loadUsuarios(0, true, "");
  }, []);

  const loadUsuarios = async (p, reset = false, nome = "") => {
    if (p === 0) {
      setLoading(true);
    } else {
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
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  const handleFilter = useCallback((texto) => {
    setFilter(texto);
    clearTimeout(filterTimeout.current);
    filterTimeout.current = setTimeout(() => {
      loadUsuarios(0, true, texto.trim());
    }, 400);
  }, []);

  const handleEndReached = () => {
    if (hasMore && !loadingMoreRef.current && !loading) {
      loadUsuarios(page + 1, false, filter.trim());
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardNome}>{item.Nome}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.Acesso === 1 ? "#e8f5e9" : "#fbe9e7" }]}>
          <View style={[styles.statusDot, { backgroundColor: item.Acesso === 1 ? "#2ecc71" : "#e74c3c" }]} />
          <Text style={[styles.statusBadgeText, { color: item.Acesso === 1 ? "#2e7d32" : "#c62828" }]}>
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
          <Text style={styles.cardRfid}>{item.UniqueID || "Não atribuído"}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image style={styles.logo1} source={require("../../imgs/icon.jpeg")} />
        </Animatable.View>
        <Animatable.View animation="fadeInDown" delay={500}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.divider} />
            <Text style={styles.text}>Crachá de Usuários</Text>
          </View>
        </Animatable.View>
      </View>

      <View style={styles.content}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar por Nome ou CPF"
            placeholderTextColor="#999"
            value={filter}
            onChangeText={handleFilter}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#a31821" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item, index) => (item?.CPF ?? index).toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.lista}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {filter ? "Nenhum resultado para a busca." : "Nenhum usuário cadastrado."}
              </Text>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color="#a31821" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#a31821" },
  containerHeader: { alignItems: "center", justifyContent: "center" },
  headerTitleContainer: { flexDirection: "row", justifyContent: "center" },
  logo1: { width: 200, height: 200 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#FFF", width: "300%", position: "absolute" },
  text: { color: "white", fontSize: 18, fontFamily: "AnonymousPro_700Bold" },
  content: { flex: 1, backgroundColor: "#FFF", padding: 16 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "AnonymousPro_400Regular",
    color: "#222",
    padding: 0,
  },
  lista: { paddingBottom: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#a31821",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardNome: { fontSize: 14, color: "#222", fontFamily: "AnonymousPro_700Bold", flex: 1, marginRight: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: "AnonymousPro_700Bold" },
  cardBody: { borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingTop: 8 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  cardLabel: { fontSize: 12, color: "#999", fontFamily: "AnonymousPro_700Bold" },
  cardValue: { fontSize: 12, color: "#444", fontFamily: "AnonymousPro_400Regular" },
  cardRfid: { fontSize: 12, color: "#a31821", fontFamily: "AnonymousPro_700Bold" },
  loadingContainer: { justifyContent: "center", alignItems: "center", paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#888", fontFamily: "AnonymousPro_400Regular" },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 14, color: "#888", fontFamily: "AnonymousPro_400Regular" },
});
