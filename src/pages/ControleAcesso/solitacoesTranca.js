import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { API_URL, API_URL2 } from "@env";

export default function SolicitacoesTranca({ route }) {
  const { ambienteId } = route.params;
  const navigation = useNavigation();

  const [ambienteTranca, setAmbienteTranca] = useState("");
  const [trancaSalaId, setTrancaSalaId] = useState(null);
  const [acessos, setAcessos] = useState([]);
  const [loading, setLoading] = useState(true);

  // busca de usuários
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // modal de adicionar acesso
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [dataLimite, setDataLimite] = useState("");
  const [horaInicial, setHoraInicial] = useState("00:00:00");
  const [horaFinal, setHoraFinal] = useState("23:59:59");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetchAmbiente();
  }, [ambienteId]);

  useEffect(() => {
    if (trancaSalaId) {
      fetchAcessos();
    } else if (trancaSalaId === null && ambienteTranca !== "") {
      setLoading(false);
    }
  }, [trancaSalaId]);

  const fetchAmbiente = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/ambiente/onlyOne/${ambienteId}`);
      setAmbienteTranca(data.nome || "Ambiente Desconhecido");
      setTrancaSalaId(data.trancaSalaId ?? null);
    } catch (error) {
      console.error("Erro ao buscar ambiente:", error.message);
      setLoading(false);
    }
  };

  const fetchAcessos = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL2}/acesso/sala/${trancaSalaId}`);
      setAcessos(data);
    } catch (error) {
      console.error("Erro ao buscar acessos da tranca:", error.message);
      Alert.alert("Erro", `Erro ao buscar solicitações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBusca = useCallback(async (texto) => {
    setBusca(texto);
    if (texto.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }
    try {
      setBuscando(true);
      const { data } = await axios.get(`${API_URL2}/usuarios/busca`, {
        params: { nome: texto.trim() },
      });
      setResultadosBusca(data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error.message);
    } finally {
      setBuscando(false);
    }
  }, []);

  const abrirModalAdicionar = (usuario) => {
    setUsuarioSelecionado(usuario);
    setDataLimite("");
    setHoraInicial("00:00:00");
    setHoraFinal("23:59:59");
    setModalVisible(true);
    setResultadosBusca([]);
    setBusca("");
  };

  const handleAdicionarAcesso = async () => {
    if (!dataLimite.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD");
      return;
    }
    if (!horaInicial.match(/^\d{2}:\d{2}:\d{2}$/) || !horaFinal.match(/^\d{2}:\d{2}:\d{2}$/)) {
      Alert.alert("Hora inválida", "Use o formato HH:MM:SS");
      return;
    }
    try {
      setSalvando(true);
      await axios.post(`${API_URL2}/acesso`, {
        salaId: trancaSalaId,
        cpf: usuarioSelecionado.CPF,
        dataLimite,
        horaAcessoInicial: horaInicial,
        horaAcessoFinal: horaFinal,
      });
      setModalVisible(false);
      fetchAcessos();
    } catch (error) {
      Alert.alert("Erro", `Não foi possível adicionar o acesso: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleRevogar = (acessoId, nomeUsuario) => {
    Alert.alert(
      "Revogar Acesso",
      `Deseja revogar o acesso de ${nomeUsuario || "este usuário"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revogar",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.put(`${API_URL2}/acesso/${acessoId}/revogar`);
              fetchAcessos();
            } catch (error) {
              Alert.alert("Erro", `Não foi possível revogar: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const formatarDataLimite = (instant) => {
    if (!instant) return "-";
    const d = new Date(instant);
    return d.toLocaleDateString("pt-BR");
  };

  const renderAcesso = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardNome}>{item.nomeAmbiente}</Text>
        <Text style={styles.cardInfo}>CPF: {item.cpfUsuario}</Text>
        <Text style={styles.cardInfo}>Válido até: {formatarDataLimite(item.dataLimite)}</Text>
        <Text style={styles.cardInfo}>
          Horário: {item.horaAcessoInicial} — {item.horaAcessoFinal}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.btnRevogar}
        onPress={() => handleRevogar(item.id, item.cpfUsuario)}
      >
        <Text style={styles.btnRevogarText}>Revogar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResultadoBusca = ({ item }) => (
    <TouchableOpacity style={styles.resultadoBusca} onPress={() => abrirModalAdicionar(item)}>
      <Text style={styles.resultadoNome}>{item.Nome}</Text>
      <Text style={styles.resultadoCpf}>CPF: {item.CPF}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image style={styles.logo1} source={require("../imgs/icon.jpeg")} />
        </Animatable.View>
        <Animatable.View animation="fadeInDown" delay={500}>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <View style={styles.divider} />
            <Text style={styles.text}>{ambienteTranca}</Text>
          </View>
        </Animatable.View>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("ControleAcesso", { ambienteId })}
        >
          <Text style={styles.navText}>Aplicativo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.activeButton]}
          onPress={() => navigation.navigate("solicitacoesTranca", { ambienteId })}
        >
          <Text style={[styles.navText, styles.activeText]}>Crachá</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {trancaSalaId === null && !loading ? (
          <View style={styles.semMapeamento}>
            <Text style={styles.semMapeamentoText}>
              Este ambiente não possui tranca configurada.
            </Text>
          </View>
        ) : (
          <>
            {/* Barra de busca */}
            <View style={styles.buscaContainer}>
              <TextInput
                style={styles.buscaInput}
                placeholder="Buscar usuário por nome..."
                placeholderTextColor="#999"
                value={busca}
                onChangeText={handleBusca}
              />
              {buscando && <Text style={styles.buscandoText}>Buscando...</Text>}
            </View>

            {/* Resultados da busca */}
            {resultadosBusca.length > 0 && (
              <View style={styles.resultadosContainer}>
                <FlatList
                  data={resultadosBusca}
                  keyExtractor={(item) => item.CPF.toString()}
                  renderItem={renderResultadoBusca}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 200 }}
                />
              </View>
            )}

            {/* Lista de acessos */}
            {loading ? (
              <Text style={styles.loadingText}>Carregando...</Text>
            ) : (
              <FlatList
                data={acessos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAcesso}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                  <Text style={styles.vazioText}>Nenhum acesso cadastrado.</Text>
                }
                keyboardShouldPersistTaps="handled"
              />
            )}
          </>
        )}
      </View>

      {/* Modal adicionar acesso */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Adicionar Acesso</Text>
            {usuarioSelecionado && (
              <>
                <Text style={styles.modalUsuario}>{usuarioSelecionado.Nome}</Text>
                <Text style={styles.modalCpf}>CPF: {usuarioSelecionado.CPF}</Text>
              </>
            )}

            <Text style={styles.modalLabel}>Data limite (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2025-12-31"
              placeholderTextColor="#aaa"
              value={dataLimite}
              onChangeText={setDataLimite}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Hora inicial (HH:MM:SS)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="00:00:00"
              placeholderTextColor="#aaa"
              value={horaInicial}
              onChangeText={setHoraInicial}
            />

            <Text style={styles.modalLabel}>Hora final (HH:MM:SS)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="23:59:59"
              placeholderTextColor="#aaa"
              value={horaFinal}
              onChangeText={setHoraFinal}
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleAdicionarAcesso}
                disabled={salvando}
              >
                <Text style={styles.modalBtnText}>{salvando ? "Salvando..." : "Confirmar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  logo1: {
    width: 200,
    height: 200,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFF",
    width: "5000%",
    position: "absolute",
  },
  text: {
    color: "white",
    fontSize: 18,
    fontFamily: "AnonymousPro_700Bold",
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
  },
  navButton: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeButton: {
    borderBottomColor: "#a31821",
  },
  navText: {
    fontFamily: "AnonymousPro_700Bold",
    fontSize: 16,
    color: "#000",
  },
  activeText: {
    color: "#a31821",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  buscaContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  buscaInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    fontFamily: "AnonymousPro_400Regular",
    color: "#000",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buscandoText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontFamily: "AnonymousPro_400Regular",
  },
  resultadosContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  resultadoBusca: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultadoNome: {
    fontSize: 14,
    fontFamily: "AnonymousPro_700Bold",
    color: "#222",
  },
  resultadoCpf: {
    fontSize: 12,
    fontFamily: "AnonymousPro_400Regular",
    color: "#666",
  },
  lista: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardNome: {
    fontSize: 13,
    fontFamily: "AnonymousPro_700Bold",
    color: "#222",
    marginBottom: 2,
  },
  cardInfo: {
    fontSize: 12,
    fontFamily: "AnonymousPro_400Regular",
    color: "rgba(0,0,0,0.6)",
    marginTop: 1,
  },
  btnRevogar: {
    backgroundColor: "#a31821",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  btnRevogarText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "AnonymousPro_700Bold",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
    fontFamily: "AnonymousPro_400Regular",
  },
  vazioText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
    color: "#888",
    fontFamily: "AnonymousPro_400Regular",
  },
  semMapeamento: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  semMapeamentoText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    fontFamily: "AnonymousPro_400Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "88%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
  },
  modalTitulo: {
    fontSize: 18,
    fontFamily: "AnonymousPro_700Bold",
    color: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  modalUsuario: {
    fontSize: 15,
    fontFamily: "AnonymousPro_700Bold",
    color: "#a31821",
    textAlign: "center",
  },
  modalCpf: {
    fontSize: 12,
    fontFamily: "AnonymousPro_400Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: "AnonymousPro_700Bold",
    color: "#444",
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    fontFamily: "AnonymousPro_400Regular",
    color: "#000",
    backgroundColor: "#f9f9f9",
  },
  modalBotoes: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnConfirm: {
    backgroundColor: "#a31821",
  },
  modalBtnCancel: {
    backgroundColor: "#888",
  },
  modalBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "AnonymousPro_700Bold",
  },
});
