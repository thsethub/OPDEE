import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { contextDeviceId } from "../../../context/contextGlobal/contex";
import axios from "axios";
import { API_URL } from "@env";

export default function ControleAcesso({ route }) {
  const { ambienteId } = route.params;
  const deviceId = useContext(contextDeviceId);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [nomeAmbiente, setNomeAmbiente] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [perfil, setPerfil] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState(null);
  const [availablePerfis, setAvailablePerfis] = useState([]);
  const [solicitacaoToEdit, setSolicitacaoToEdit] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUsuarioLogado();
  }, [deviceId]);

  useEffect(() => {
    if (usuarioLogado) {
      fetchSolicitacoes();
      fetchNomeAmbiente();
    }
  }, [usuarioLogado, ambienteId]);

  const fetchUsuarioLogado = async () => {
    try {
      const { data: usuarioData, error: usuarioError } = await axios.get(
        `${API_URL}/usuario/${deviceId}`
      );
      if (usuarioError) {
        console.error("Erro ao buscar usuário logado:", usuarioError);
        return;
      }
      setUsuarioLogado(usuarioData);
    } catch (error) {
      console.error("Erro ao buscar usuário logado:", error.message);
    }
  };

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      const { data: acessosData, error: acessosError } = await axios.get(
        `${API_URL}/acesso/ambiente/${ambienteId}`
      );
      if (acessosError) {
        console.error("Erro ao buscar solicitações:", acessosError);
        return;
      }
      const solicitacoesComNomes = await Promise.all(
        acessosData.map(async (solicitacao) => {
          const { data: usuarioData, error: usuarioError } = await axios.get(
            `${API_URL}/usuario/${solicitacao.usuarioId}`
          );
          if (usuarioError) {
            console.error("Erro ao buscar nome do usuário:", usuarioError);
            return solicitacao;
          }
          return {
            ...solicitacao,
            nomeUsuario: usuarioData.nomeCompleto || "Usuário desconhecido",
          };
        })
      );

      let filteredSolicitacoes = solicitacoesComNomes;
      if (!usuarioLogado.superUser) {
        filteredSolicitacoes = solicitacoesComNomes.filter(
          (solicitacao) => solicitacao.tipoUsuario !== "Coordenador"
        );
      }
      setSolicitacoes(filteredSolicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNomeAmbiente = async () => {
    try {
      const { data: ambienteData, error: ambienteError } = await axios.get(
        `${API_URL}/ambiente/onlyOne/${ambienteId}`
      );
      if (ambienteError) {
        console.error("Erro ao buscar nome do ambiente:", ambienteError);
        return;
      }
      setNomeAmbiente(ambienteData.nome);
    } catch (error) {
      console.error("Erro ao buscar nome do ambiente:", error.message);
    }
  };

  const fetchPerfis = async () => {
    try {
      const { data: perfisData, error: perfisError } = await axios.get(
        `${API_URL}/perfil`
      );
      if (perfisError) {
        console.error("Erro ao buscar perfis:", perfisError);
        return;
      }
      const filteredPerfis = perfisData.filter(
        (perfil) => perfil.nome !== "Coordenador"
      );
      setAvailablePerfis(filteredPerfis);
    } catch (error) {
      console.error("Erro ao buscar perfis:", error.message);
    }
  };

  const handleEditPerfil = (solicitacao) => {
    setSolicitacaoToEdit(solicitacao);
    fetchPerfis();
    setModalVisible(true);
  };

  const handleDelete = async (solicitacaoId) => {
    Alert.alert(
      "Excluir Solicitação",
      "Tem certeza que deseja excluir esta solicitação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await axios.delete(
                `${API_URL}/acesso/${solicitacaoId}`
              );
              if (error) {
                Alert.alert("Erro", "Erro ao deletar a solicitação.");
                return;
              }
              fetchSolicitacoes();
            } catch (error) {
              console.error("Erro ao deletar acesso:", error.message);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleToggleActivation = async (solicitacaoId, ativo) => {
    try {
      const { data, error } = await axios.put(
        `${API_URL}/acesso/${solicitacaoId}`
      );
      if (error) {
        console.error("Erro ao atualizar status de ativação:", error);
        return;
      }
      fetchSolicitacoes();
    } catch (error) {
      console.error("Erro ao atualizar status de ativação:", error.message);
    }
  };

  const handleConfirmEditPerfil = async () => {
    if (selectedPerfil) {
      try {
        const { data, error } = await axios.put(
          `${API_URL}/acesso/perfil/${solicitacaoToEdit.id}`,
          {
            tipoUsuario: selectedPerfil.nome,
            ativo: solicitacaoToEdit.ativo,
          }
        );
        if (error) {
          Alert.alert("Erro", "Erro ao atualizar o perfil.");
          return;
        }
        fetchSolicitacoes();
        setModalVisible(false);
        setSelectedPerfil(null);
        setSolicitacaoToEdit(null);
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error.message);
      }
    } else {
      Alert.alert("Erro", "Por favor, selecione um perfil.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image style={styles.logo1} source={require("../imgs/icon.jpeg")} />
        </Animatable.View>
        <Animatable.View animation="fadeInDown" delay={500} style={styles.headerTitleAnimated}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.divider} />
            <Text style={styles.text}>{nomeAmbiente}</Text>
          </View>
        </Animatable.View>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navButton, styles.activeButton]}
          onPress={() => navigation.navigate("ControleAcesso", { ambienteId })}
        >
          <Text style={[styles.navText, styles.activeText]}>Aplicativo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("solicitacoesTranca", { ambienteId })}
        >
          <Text style={styles.navText}>Crachá</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#a31821" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : solicitacoes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma solicitação encontrada.</Text>
            </View>
          ) : (
            solicitacoes.map((solicitacao) => (
              <View
                style={styles.solicitacaoContainer}
                key={solicitacao.usuarioId}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.nomeUsuario}>
                    {solicitacao.nomeUsuario}
                  </Text>
                  <View style={styles.perfilBadge}>
                    <Text style={styles.perfilBadgeText}>
                      {solicitacao.tipoUsuario}
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: solicitacao.ativo ? "#2ecc71" : "#e74c3c" },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {solicitacao.ativo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.btnEditar}
                      onPress={() => handleEditPerfil(solicitacao)}
                    >
                      <Text style={styles.btnEditarText}>Editar Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnExcluir}
                      onPress={() => handleDelete(solicitacao.id)}
                    >
                      <Text style={styles.btnExcluirText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Switch
                  value={solicitacao.ativo}
                  onValueChange={(newValue) =>
                    handleToggleActivation(solicitacao.id, newValue)
                  }
                  trackColor={{ false: "#ddd", true: "#f5c6cb" }}
                  thumbColor={solicitacao.ativo ? "#a31821" : "#ccc"}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Selecione um perfil</Text>
            {solicitacaoToEdit && (
              <Text style={styles.modalSubtitle}>
                {solicitacaoToEdit.nomeUsuario}
              </Text>
            )}
            <FlatList
              data={availablePerfis}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.perfilItem,
                    selectedPerfil && selectedPerfil.id === item.id
                      ? styles.selectedPerfil
                      : null,
                  ]}
                  onPress={() => setSelectedPerfil(item)}
                >
                  <Text
                    style={[
                      styles.perfilText,
                      selectedPerfil && selectedPerfil.id === item.id
                        ? styles.selectedPerfilText
                        : null,
                    ]}
                  >
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={handleConfirmEditPerfil}
              >
                <Text style={styles.modalBtnText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnCancel}
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
  headerTitleAnimated: {
    width: "100%",
  },
  headerTitleContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFF",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  logo1: {
    width: 200,
    height: 200,
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
    color: "#999",
  },
  activeText: {
    color: "#a31821",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
    minHeight: "100%",
  },
  loadingContainer: {
    flex: 1,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    fontFamily: "AnonymousPro_400Regular",
  },
  solicitacaoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
    padding: 14,
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#a31821",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  nomeUsuario: {
    fontSize: 15,
    color: "#222",
    fontFamily: "AnonymousPro_700Bold",
    marginBottom: 6,
  },
  perfilBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  perfilBadgeText: {
    fontSize: 11,
    color: "#555",
    fontFamily: "AnonymousPro_700Bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "AnonymousPro_400Regular",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  btnEditar: {
    backgroundColor: "#a31821",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnEditarText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "AnonymousPro_700Bold",
  },
  btnExcluir: {
    backgroundColor: "#FFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnExcluirText: {
    color: "#666",
    fontSize: 11,
    fontFamily: "AnonymousPro_700Bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "AnonymousPro_700Bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: "AnonymousPro_400Regular",
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },
  perfilItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 6,
  },
  selectedPerfil: {
    backgroundColor: "#a31821",
  },
  perfilText: {
    fontSize: 15,
    fontFamily: "AnonymousPro_400Regular",
    color: "#333",
  },
  selectedPerfilText: {
    color: "#FFF",
    fontFamily: "AnonymousPro_700Bold",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  modalBtnConfirm: {
    flex: 1,
    backgroundColor: "#a31821",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: "#888",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "AnonymousPro_700Bold",
  },
});
