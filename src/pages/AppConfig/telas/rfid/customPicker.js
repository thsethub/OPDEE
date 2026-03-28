import React, { useState } from "react";
import {
  Modal,
  Text,
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  TextInput,
} from "react-native";
import { FontAwesome as Icon } from "@expo/vector-icons";

const CustomPicker = ({
  items,
  selectedValue,
  onValueChange,
  style,
  placeholder,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState("");

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  const filteredItems = items.filter(
    (item) =>
      (item.Nome &&
        typeof item.Nome === "string" &&
        item.Nome.toLowerCase().includes(filter.toLowerCase())) ||
      (item.CPF &&
        typeof item.CPF === "number" &&
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
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TextInput
              style={styles.input}
              placeholder="Filtrar por Nome ou CPF"
              value={filter}
              onChangeText={setFilter}
            />
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.CPF.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleSelect(item)}
                >
                  <View
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: "#a31821",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "AnonymousPro_400Regular",
                      }}
                    >
                      {item.Nome}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "AnonymousPro_400Regular",
                      }}
                    >
                      {item.CPF}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
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
    height: 54,
    marginTop: 15,
    justifyContent: "center",
    paddingLeft: 10,
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
  },
});

export default CustomPicker;
