import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { API_URL, API_URL2 } from "@env";

const PAGE_SIZE = 10;

const getCurrentTime = () =>
  [new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

const instantToInputDate = (instant) => {
  if (!instant) return "";
  return new Date(instant).toISOString().split("T")[0];
};

export default function SolicitacoesTranca({ route }) {
  const { ambienteId } = route.params;
  const navigation = useNavigation();

  const [ambienteTranca, setAmbienteTranca] = useState("");
  const [trancaSalaId, setTrancaSalaId] = useState(null);
  const [semMapeamento, setSemMapeamento] = useState(false);

  // Lista paginada de acessos (com filtro de busca)
  const [acessos, setAcessos] = useState([]);
  const [acessosPage, setAcessosPage] = useState(0);
  const [acessosLoading, setAcessosLoading] = useState(true);
  const [acessosLoadingMore, setAcessosLoadingMore] = useState(false);
  const [acessosHasMore, setAcessosHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  // Busca dentro dos acessos existentes
  const [busca, setBusca] = useState("");
  const buscaTimeout = useRef(null);

  // Busca de usuários disponíveis para adicionar
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [buscaAdd, setBuscaAdd] = useState("");
  const [resultadosAdd, setResultadosAdd] = useState([]);
  const [buscandoAdd, setBuscandoAdd] = useState(false);
  const [resultadosAddPage, setResultadosAddPage] = useState(0);
  const [resultadosAddHasMore, setResultadosAddHasMore] = useState(true);
  const [resultadosAddLoadingMore, setResultadosAddLoadingMore] = useState(false);
  const loadingMoreAddRef = useRef(false);
  const buscaAddAtual = useRef("");
  const buscaAddTimeout = useRef(null);

  // Modal adicionar - 2 etapas: 0=busca, 1=confirmar usuário, 2=data/hora
  const [addStep, setAddStep] = useState(0);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [dataLimite, setDataLimite] = useState("");
  const [horaInicial, setHoraInicial] = useState("");
  const [horaFinal, setHoraFinal] = useState("23:59:59");
  const [salvando, setSalvando] = useState(false);

  // Modal editar acesso
  const [acessoEditando, setAcessoEditando] = useState(null);
  const [editDataLimite, setEditDataLimite] = useState("");
  const [editHoraInicial, setEditHoraInicial] = useState("");
  const [editHoraFinal, setEditHoraFinal] = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    fetchAmbiente();
  }, [ambienteId]);

  const fetchAmbiente = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/ambiente/onlyOne/${ambienteId}`);
      setAmbienteTranca(data.nome || "Ambiente Desconhecido");
      const salaId = data.trancaSalaId ?? null;
      setTrancaSalaId(salaId);
      if (!salaId) {
        setSemMapeamento(true);
        setAcessosLoading(false);
      }
    } catch (error) {
      console.error("Erro ao buscar ambiente:", error.message);
      setSemMapeamento(true);
      setAcessosLoading(false);
    }
  };

  useEffect(() => {
    if (trancaSalaId) loadAcessos(0, true, busca);
  }, [trancaSalaId]);

  const loadAcessos = async (page, reset = false, nome = "") => {
    if (page === 0) {
      setAcessosLoading(true);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setAcessosLoadingMore(true);
    }
    try {
      const { data } = await axios.get(`${API_URL2}/acesso/sala/${trancaSalaId}`, {
        params: { page, size: PAGE_SIZE, nome },
      });
      const novos = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];
      const hasMore = Array.isArray(data) ? false : data?.last === false;
      setAcessos((prev) => (reset ? novos : [...prev, ...novos]));
      setAcessosPage(page);
      setAcessosHasMore(hasMore);
    } catch (error) {
      console.error("Erro ao buscar acessos:", error.message);
    } finally {
      setAcessosLoading(false);
      setAcessosLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  const handleBusca = useCallback(
    (texto) => {
      setBusca(texto);
      clearTimeout(buscaTimeout.current);
      buscaTimeout.current = setTimeout(() => {
        if (trancaSalaId) loadAcessos(0, true, texto.trim());
      }, 400);
    },
    [trancaSalaId]
  );

  const handleEndReached = () => {
    if (acessosHasMore && !loadingMoreRef.current && !acessosLoading) {
      loadAcessos(acessosPage + 1, false, busca.trim());
    }
  };

  // ── Adicionar acesso ──────────────────────────────────────────────────────

  const loadUsuariosDisponiveis = async (page, reset = false, nome = "") => {
    if (!trancaSalaId) return;
    const nomeBusca = nome.trim();

    if (page === 0) {
      setBuscandoAdd(true);
    } else {
      if (loadingMoreAddRef.current) return;
      loadingMoreAddRef.current = true;
      setResultadosAddLoadingMore(true);
    }

    try {
      const { data } = await axios.get(`${API_URL2}/usuarios/disponiveis`, {
        params: { nome: nomeBusca, salaId: trancaSalaId, page, size: PAGE_SIZE },
      });
      const lista = Array.isArray(data) ? data : data?.content ?? [];
      const hasMore = Array.isArray(data) ? false : data?.last === false;
      setResultadosAdd((prev) => (reset ? lista : [...prev, ...lista]));
      setResultadosAddPage(page);
      setResultadosAddHasMore(hasMore);
    } catch (error) {
      console.error("Erro ao buscar usuários disponíveis:", error.message);
    } finally {
      setBuscandoAdd(false);
      setResultadosAddLoadingMore(false);
      loadingMoreAddRef.current = false;
    }
  };

  const handleBuscaAdd = useCallback(
    (texto) => {
      setBuscaAdd(texto);
      buscaAddAtual.current = texto;
      clearTimeout(buscaAddTimeout.current);
      buscaAddTimeout.current = setTimeout(() => {
        loadUsuariosDisponiveis(0, true, texto);
      }, texto.trim().length === 0 ? 0 : 400);
    },
    [trancaSalaId]
  );

  const handleEndReachedAdd = () => {
    if (resultadosAddHasMore && !loadingMoreAddRef.current && !buscandoAdd) {
      loadUsuariosDisponiveis(resultadosAddPage + 1, false, buscaAddAtual.current);
    }
  };

  const selecionarUsuario = (usuario) => {
    setUsuarioSelecionado(usuario);
    setResultadosAdd([]);
    setBuscaAdd("");
    setDataLimite("");
    setHoraInicial(getCurrentTime());
    setHoraFinal("23:59:59");
    setAddStep(1);
  };

  const handleConfirmarAcesso = async () => {
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
        sala_id: trancaSalaId,
        cpf: usuarioSelecionado.CPF,
        data_limite: dataLimite,
        hora_acesso_inicial: horaInicial,
        hora_acesso_final: horaFinal,
      });
      setModalAdicionar(false);
      setAddStep(0);
      loadAcessos(0, true, busca.trim());
    } catch (error) {
      Alert.alert("Erro", `Não foi possível adicionar o acesso: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  // ── Editar acesso ─────────────────────────────────────────────────────────

  const abrirEdicao = (item) => {
    setAcessoEditando(item);
    setEditDataLimite(instantToInputDate(item.data_limite));
    setEditHoraInicial(item.hora_acesso_inicial || "");
    setEditHoraFinal(item.hora_acesso_final || "");
  };

  const handleSalvarEdicao = async () => {
    if (!editDataLimite.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD");
      return;
    }
    if (!editHoraInicial.match(/^\d{2}:\d{2}:\d{2}$/) || !editHoraFinal.match(/^\d{2}:\d{2}:\d{2}$/)) {
      Alert.alert("Hora inválida", "Use o formato HH:MM:SS");
      return;
    }
    try {
      setEditando(true);
      await axios.put(`${API_URL2}/acesso/${acessoEditando.id}`, {
        data_limite: editDataLimite,
        hora_acesso_inicial: editHoraInicial,
        hora_acesso_final: editHoraFinal,
      });
      setAcessoEditando(null);
      loadAcessos(0, true, busca.trim());
    } catch (error) {
      Alert.alert("Erro", `Não foi possível editar: ${error.message}`);
    } finally {
      setEditando(false);
    }
  };

  // ── Revogar ───────────────────────────────────────────────────────────────

  const handleRevogar = (item) => {
    Alert.alert(
      "Revogar Acesso",
      `Deseja revogar o acesso de ${item.nome_usuario}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revogar",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.put(`${API_URL2}/acesso/${item.id}/revogar`);
              loadAcessos(0, true, busca.trim());
            } catch (error) {
              Alert.alert("Erro", `Não foi possível revogar: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatarData = (instant) => {
    if (!instant) return "-";
    return new Date(instant).toLocaleDateString("pt-BR");
  };

  const handleDataChange = (setter) => (texto) => {
    const d = texto.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 4) setter(d);
    else if (d.length <= 6) setter(`${d.slice(0, 4)}-${d.slice(4)}`);
    else setter(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`);
  };

  const handleTimeChange = (setter) => (texto) => {
    const t = texto.replace(/\D/g, "").slice(0, 6);
    if (t.length <= 2) setter(t);
    else if (t.length <= 4) setter(`${t.slice(0, 2)}:${t.slice(2)}`);
    else setter(`${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4)}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderAcesso = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardNome}>{item.nome_usuario}</Text>
        <Text style={styles.cardInfo}>CPF: {item.cpf_usuario}</Text>
        {item.unique_id ? <Text style={styles.cardInfo}>Crachá: {item.unique_id}</Text> : null}
        <Text style={styles.cardInfo}>Válido até: {formatarData(item.data_limite)}</Text>
        <Text style={styles.cardInfo}>
          {item.hora_acesso_inicial} — {item.hora_acesso_final}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnRevogar} onPress={() => handleRevogar(item)}>
          <Text style={styles.btnActionText}>Revogar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}>
          <Text style={styles.btnActionText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () =>
    acessosLoadingMore ? (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color="#a31821" />
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerHeader}>
        <Animatable.View animation="fadeInDown" delay={500}>
          <Image style={styles.logo1} source={require("../imgs/icon.jpeg")} />
        </Animatable.View>
        <Animatable.View animation="fadeInDown" delay={500} style={styles.headerTitleAnimated}>
          <View style={styles.headerTitleContainer}>
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
        <TouchableOpacity style={[styles.navButton, styles.activeButton]}>
          <Text style={[styles.navText, styles.activeText]}>Crachá</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {semMapeamento ? (
          <View style={styles.semMapeamento}>
            <Text style={styles.semMapeamentoText}>
              Este ambiente não possui tranca configurada.
            </Text>
          </View>
        ) : (
          <>
            {/* Barra de busca + botão adicionar */}
            <View style={styles.buscaContainer}>
              <View style={styles.buscaWrapper}>
                <Ionicons name="search" size={16} color="#aaa" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.buscaInput}
                  placeholder="Pesquisar por nome..."
                  placeholderTextColor="#aaa"
                  value={busca}
                  onChangeText={handleBusca}
                />
              </View>
              <TouchableOpacity
                style={styles.btnAdd}
                onPress={() => {
                  setBuscaAdd("");
                  buscaAddAtual.current = "";
                  setResultadosAdd([]);
                  setResultadosAddPage(0);
                  setResultadosAddHasMore(true);
                  setResultadosAddLoadingMore(false);
                  loadingMoreAddRef.current = false;
                  setAddStep(0);
                  setModalAdicionar(true);
                  setTimeout(() => loadUsuariosDisponiveis(0, true, ""), 50);
                }}
              >
                <Ionicons name="person-add-outline" size={20} color="#a31821" />
              </TouchableOpacity>
            </View>

            {/* Lista paginada */}
            {acessosLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#a31821" />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : (
              <FlatList
                data={acessos}
                keyExtractor={(item, index) => (item?.id ?? index).toString()}
                renderItem={renderAcesso}
                contentContainerStyle={styles.lista}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.vazioText}>Nenhum acesso cadastrado.</Text>
                }
              />
            )}
          </>
        )}
      </View>

      {/* ── Modal Adicionar ─────────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalAdicionar}
        onRequestClose={() => setModalAdicionar(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalAdicionar(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBox} onPress={() => {}}>
            {addStep === 0 && (
              <>
                <Text style={styles.modalTitulo}>Adicionar acesso</Text>
                <View style={styles.modalBuscaWrapper}>
                  <Ionicons name="search" size={16} color="#aaa" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.buscaInput}
                    placeholder="Buscar usuário por nome..."
                    placeholderTextColor="#aaa"
                    value={buscaAdd}
                    onChangeText={handleBuscaAdd}
                    autoFocus
                  />
                  {buscandoAdd && (
                    <ActivityIndicator size="small" color="#a31821" style={{ marginLeft: 8 }} />
                  )}
                </View>
                <FlatList
                  data={resultadosAdd}
                  keyExtractor={(item, index) => (item?.CPF ?? index).toString()}
                  style={{ maxHeight: 220, marginTop: 8 }}
                  keyboardShouldPersistTaps="handled"
                  onEndReached={handleEndReachedAdd}
                  onEndReachedThreshold={0.25}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.resultadoBusca}
                      onPress={() => selecionarUsuario(item)}
                    >
                      <Text style={styles.resultadoNome}>{item.Nome}</Text>
                      <Text style={styles.resultadoCpf}>CPF: {item.CPF}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    !buscandoAdd ? (
                      <Text style={styles.resultadoVazio}>Nenhum usuário disponível.</Text>
                    ) : null
                  }
                  ListFooterComponent={
                    resultadosAddLoadingMore ? (
                      <View style={styles.modalListaFooter}>
                        <ActivityIndicator size="small" color="#a31821" />
                      </View>
                    ) : null
                  }
                />
                <TouchableOpacity
                  style={[styles.modalBtnCancel, styles.modalBtnSolo]}
                  onPress={() => setModalAdicionar(false)}
                >
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}

            {addStep === 1 && usuarioSelecionado && (
              <>
                <Text style={styles.modalTitulo}>Confirmar usuário</Text>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Nome</Text>
                  <Text style={styles.modalInfoValue}>{usuarioSelecionado.Nome}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>CPF</Text>
                  <Text style={styles.modalInfoValue}>{usuarioSelecionado.CPF}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Crachá</Text>
                  <Text style={styles.modalInfoValue}>
                    {usuarioSelecionado.UniqueID || "Não cadastrado"}
                  </Text>
                </View>
                <View style={styles.modalBotoes}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setAddStep(0)}
                  >
                    <Text style={styles.modalBtnText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={() => setAddStep(2)}
                  >
                    <Text style={styles.modalBtnText}>Próximo</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {addStep === 2 && (
              <>
                <Text style={styles.modalTitulo}>Definir acesso</Text>
                {usuarioSelecionado && (
                  <Text style={styles.modalSubtitle}>{usuarioSelecionado.Nome}</Text>
                )}
                <Text style={styles.modalLabel}>Data limite</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor="#aaa"
                  value={dataLimite}
                  onChangeText={handleDataChange(setDataLimite)}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={styles.modalLabel}>Hora inicial</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="HH:MM:SS"
                  placeholderTextColor="#aaa"
                  value={horaInicial}
                  onChangeText={handleTimeChange(setHoraInicial)}
                  keyboardType="numeric"
                  maxLength={8}
                />
                <Text style={styles.modalLabel}>Hora final</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="23:59:59"
                  placeholderTextColor="#aaa"
                  value={horaFinal}
                  onChangeText={handleTimeChange(setHoraFinal)}
                  keyboardType="numeric"
                  maxLength={8}
                />
                <View style={styles.modalBotoes}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={handleConfirmarAcesso}
                    disabled={salvando}
                  >
                    <Text style={styles.modalBtnText}>
                      {salvando ? "Salvando..." : "Confirmar"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setAddStep(1)}
                  >
                    <Text style={styles.modalBtnText}>Voltar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Editar ────────────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={!!acessoEditando}
        onRequestClose={() => setAcessoEditando(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAcessoEditando(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitulo}>Editar acesso</Text>
            {acessoEditando && (
              <Text style={styles.modalSubtitle}>{acessoEditando.nome_usuario}</Text>
            )}
            <Text style={styles.modalLabel}>Data limite</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#aaa"
              value={editDataLimite}
              onChangeText={handleDataChange(setEditDataLimite)}
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={styles.modalLabel}>Hora inicial</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="HH:MM:SS"
              placeholderTextColor="#aaa"
              value={editHoraInicial}
              onChangeText={setEditHoraInicial}
            />
            <Text style={styles.modalLabel}>Hora final</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="23:59:59"
              placeholderTextColor="#aaa"
              value={editHoraFinal}
              onChangeText={setEditHoraFinal}
            />
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleSalvarEdicao}
                disabled={editando}
              >
                <Text style={styles.modalBtnText}>
                  {editando ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setAcessoEditando(null)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#a31821" },
  containerHeader: { alignItems: "center", justifyContent: "center" },
  headerTitleAnimated: { width: "100%" },
  headerTitleContainer: { width: "100%", justifyContent: "center", alignItems: "center", paddingTop: 2 },
  logo1: { width: 200, height: 200 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#FFF", position: "absolute", left: 0, right: 0, top: 0 },
  text: { color: "white", fontSize: 18, fontFamily: "AnonymousPro_700Bold" },
  navBar: { flexDirection: "row", backgroundColor: "#FFF" },
  navButton: {
    flex: 1, height: 50, justifyContent: "center", alignItems: "center",
    borderBottomWidth: 3, borderBottomColor: "transparent",
  },
  activeButton: { borderBottomColor: "#a31821" },
  navText: { fontFamily: "AnonymousPro_700Bold", fontSize: 16, color: "#999" },
  activeText: { color: "#a31821" },
  content: { flex: 1, backgroundColor: "#FFF" },
  buscaContainer: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8,
  },
  buscaWrapper: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f5f5", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderWidth: 1, borderColor: "#e0e0e0",
  },
  modalBuscaWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f5f5", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderWidth: 1, borderColor: "#e0e0e0",
  },
  buscaInput: {
    flex: 1, fontSize: 14, fontFamily: "AnonymousPro_400Regular", color: "#222", padding: 0,
  },
  btnAdd: {
    width: 42, height: 42, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, backgroundColor: "#f5f5f5",
  },
  lista: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF",
    borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#a31821",
    padding: 14, marginVertical: 6,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardNome: { fontSize: 14, fontFamily: "AnonymousPro_700Bold", color: "#222", marginBottom: 2 },
  cardInfo: { fontSize: 12, fontFamily: "AnonymousPro_400Regular", color: "rgba(0,0,0,0.55)", marginTop: 1 },
  cardActions: { gap: 6, alignItems: "stretch" },
  btnRevogar: {
    backgroundColor: "#a31821", borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: "center",
  },
  btnEditar: {
    backgroundColor: "#555", borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: "center",
  },
  btnActionText: { color: "#FFF", fontSize: 11, fontFamily: "AnonymousPro_700Bold" },
  loadingContainer: { justifyContent: "center", alignItems: "center", paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#888", fontFamily: "AnonymousPro_400Regular" },
  vazioText: { textAlign: "center", marginTop: 30, fontSize: 14, color: "#888", fontFamily: "AnonymousPro_400Regular" },
  semMapeamento: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  semMapeamentoText: { fontSize: 14, color: "#888", textAlign: "center", fontFamily: "AnonymousPro_400Regular" },
  resultadoBusca: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  resultadoNome: { fontSize: 14, fontFamily: "AnonymousPro_700Bold", color: "#222" },
  resultadoCpf: { fontSize: 12, fontFamily: "AnonymousPro_400Regular", color: "#666" },
  resultadoVazio: { textAlign: "center", paddingVertical: 16, fontSize: 13, color: "#aaa", fontFamily: "AnonymousPro_400Regular" },
  modalListaFooter: { paddingVertical: 12 },
  modalBtnSolo: { alignSelf: "stretch", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "88%", backgroundColor: "#FFF", borderRadius: 12, padding: 24 },
  modalTitulo: { fontSize: 18, fontFamily: "AnonymousPro_700Bold", color: "#222", marginBottom: 16, textAlign: "center" },
  modalSubtitle: { fontSize: 14, fontFamily: "AnonymousPro_700Bold", color: "#a31821", textAlign: "center", marginBottom: 12 },
  modalInfoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  modalInfoLabel: { fontSize: 13, fontFamily: "AnonymousPro_700Bold", color: "#888" },
  modalInfoValue: { fontSize: 13, fontFamily: "AnonymousPro_400Regular", color: "#222", flexShrink: 1, textAlign: "right" },
  modalLabel: { fontSize: 13, fontFamily: "AnonymousPro_700Bold", color: "#444", marginTop: 12, marginBottom: 4 },
  modalInput: {
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14, fontFamily: "AnonymousPro_400Regular", color: "#000", backgroundColor: "#f9f9f9",
  },
  modalBotoes: { flexDirection: "row", marginTop: 20, gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  modalBtnConfirm: { backgroundColor: "#a31821" },
  modalBtnCancel: { backgroundColor: "#888" },
  modalBtnText: { color: "#FFF", fontSize: 14, fontFamily: "AnonymousPro_700Bold" },
});
