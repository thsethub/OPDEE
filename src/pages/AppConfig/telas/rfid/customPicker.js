import { useState } from "react";
import {
  Modal,
  Text,
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { FontAwesome as Icon } from "@expo/vector-icons";

const CustomPicker = ({
  items,
  selectedValue,
  onValueChange,
  style,
  placeholder,
  onSearch,
  onLoadMore,
  loadingMore,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState("");

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
    setFilter("");
    if (onSearch) onSearch("");
  };

  const handleFilterChange = (text) => {
    setFilter(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const displayItems = onSearch
    ? items
    : items.filter(
        (item) =>
          (item.Nome &&
            typeof item.Nome === "string" &&
            item.Nome.toLowerCase().includes(filter.toLowerCase())) ||
          (item.CPF &&
            item.CPF.toString().includes(filter)),
      );

  return (
    <View style={style}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "AnonymousPro_400Regular",
              color: "rgba(0, 0, 0, 0.61)",
            }}
          >
            {selectedValue
              ? `${selectedValue.Nome} (${selectedValue.CPF})`
              : placeholder}
          </Text>
          <Icon
            name="chevron-down"
            size={20}
            color="#a31821"
            style={{ position: "absolute", right: 20 }}
          />
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TextInput
              style={styles.input}
              placeholder="Filtrar por Nome ou CPF"
              placeholderTextColor="#999"
              value={filter}
              onChangeText={handleFilterChange}
              autoCorrect={false}
            />
            <FlatList
              data={displayItems}
              keyExtractor={(item, index) => (item?.CPF ?? index).toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.itemDivider}>
                    <Text style={{ fontFamily: "AnonymousPro_400Regular" }}>
                      {item.Nome}
                    </Text>
                    <Text style={{ fontFamily: "AnonymousPro_400Regular", color: "#888", fontSize: 12 }}>
                      {item.CPF}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              onEndReached={onLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" color="#a31821" style={{ paddingVertical: 8 }} />
                ) : null
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FFF",
    width: "100%",
    minHeight: 54,
    justifyContent: "center",
    paddingLeft: 10,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: Dimensions.get("window").height / 2,
  },
  input: {
    height: 40,
    borderColor: "#a31821",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
    fontFamily: "AnonymousPro_400Regular",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    color: "#888",
    fontFamily: "AnonymousPro_400Regular",
  },
});

export default CustomPicker;
