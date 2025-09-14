import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
import { text } from "../../styles/Text";
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import { useAutoSTT } from "../../src/services/useAutoSTT";

const Header = () => (
  <View style={styles.header}>
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="star-outline" size={70} color="#FF8C42" />
      </View>
      <View style={styles.textContainer}>
        <Text style={text.header}>즐겨찾기</Text>
      </View>
    </View>
  </View>
);

const CRUD = ({ onAdd }) => (
  <View style={styles.CRUD}>
    <View style={styles.row}>
      <View style={{ flex: 2 }}></View>

      <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={onAdd}>
        <View style={styles.buttonInner}>
          <View style={styles.iconArea}>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={40}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.CRUDtextArea}>
            <Text style={styles.CRUDtext}>추가</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

const EditModal = ({
  visible,
  onClose,
  onSave,
  onDelete,
  name,
  setName,
  address,
  setAddress,
}) => {
  useEffect(() => {
    if (visible) {
      Speech.speak(`주소는 ${address}`);
    }
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modal}>
          <Text style={{ fontSize: 45, textAlign: "center", color: "#FFFFFF" }}>
            이름
          </Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            multiline={true}
          />

          <Text style={{ fontSize: 45, textAlign: "center", color: "#FFFFFF" }}>
            주소
          </Text>
          <TextInput
            style={styles.modalInput}
            value={address}
            onChangeText={setAddress}
            multiline={true}
            color="#FFFFFF"
          />

          <View style={styles.row}>
            <TouchableOpacity
              onPress={onSave}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 35, color: "#FFFFFF", textAlign: "center" }}
              >
                수정
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 35, color: "#FFFFFF", textAlign: "center" }}
              >
                삭제
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 35, color: "#FFFFFF", textAlign: "center" }}
              >
                닫기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FavoritesList = ({ favoriteList, onItemPress }) => {
  if (!Array.isArray(favoriteList) || favoriteList.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={favoriteList}
      keyExtractor={(item) => item.favorite_id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.favoriteListButton}
          onPress={() => onItemPress(item)}
        >
          <Text style={styles.favoriteName}>{item.name}</Text>
          <Text style={styles.favoriteAddress}>{item.address}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

const AddModal = ({
  visible,
  onClose,
  onSave,
  name,
  setName,
  address,
  setAddress,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalBackground}>
      <View style={styles.modal}>
        <Text
          style={{
            fontSize: 60,
            marginBottom: 10,
            textAlign: "center",
            color: "#FFFFFF",
          }}
        >
          이름
        </Text>
        <TextInput
          style={styles.modalInput}
          value={name}
          onChangeText={setName}
          multiline={true}
          placeholderTextColor="#FFFFFF"
          placeholder="이름을 입력하세요"
        />

        <Text
          style={{
            fontSize: 60,
            marginBottom: 10,
            textAlign: "center",
            color: "#FFFFFF",
          }}
        >
          주소
        </Text>
        <TextInput
          style={styles.modalInput}
          value={address}
          onChangeText={setAddress}
          multiline={true}
          placeholderTextColor="#FFFFFF"
          placeholder="주소를 입력하세요"
        />

        <View style={styles.row}>
          <TouchableOpacity
            onPress={onSave}
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{ fontSize: 35, color: "#FFFFFF", textAlign: "center" }}
            >
              추가
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{ fontSize: 35, color: "#FFFFFF", textAlign: "center" }}
            >
              닫기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const Favorites = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [favoriteList, setFavoriteList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const getFavoriteList = async () => {
    const deviceId = await SecureStore.getItemAsync("deviceId");
    const url = `서버IP/setting/favorites?device_id=${encodeURIComponent(
      deviceId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      setFavoriteList(data);
    } else {
      console.log("서버 응답 실패");
    }
  };

  useEffect(() => {
    Speech.speak("즐겨찾기");
    getFavoriteList();
  }, []);

  const handleSave = async () => {
    if (disabled) {
      return;
    }

    setDisabled(true);
    if (name == "" || address == "") {
      alert("이름과 주소를 모두 입력해주세요!");
      setDisabled(false);
      return;
    }
    const deviceId = await SecureStore.getItemAsync("deviceId");
    const response = await fetch("서버IP/setting/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: deviceId,
        name: name,
        address: address,
      }),
    });

    if (response.ok) {
      await getFavoriteList();
      setName("");
      setAddress("");
      setDisabled(false);
      Speech.speak("추가 성공");
    } else {
      Speech.speak("추가 실패");
    }
    setIsModalVisible(false);
  };

  const handleChange = async () => {
    const deviceId = await SecureStore.getItemAsync("deviceId");
    if (editName === "" || editAddress === "") {
      alert("이름과 주소를 모두 입력해주세요!");
      setDisabled(false);
      return;
    }
    const response = await fetch(
      `서버IP/setting/favorites/${selectedItem.favorite_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: deviceId,
          name: editName,
          address: editAddress,
        }),
      }
    );

    if (response.ok) {
      await getFavoriteList();
      setEditName("");
      setEditAddress("");
      setSelectedItem(null);
      setDisabled(false);
      Speech.speak("수정완료");
    } else {
      Speech.speak("수정 실패");
    }
    setIsEditModalVisible(false);
  };

  const handleDelete = async () => {
    const deviceId = await SecureStore.getItemAsync("deviceId");
    try {
      const response = await fetch(
        `서버IP/setting/favorites/${selectedItem.favorite_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Device-ID": deviceId,
          },
        }
      );

      if (response.ok) {
        await getFavoriteList();
        setEditName("");
        setEditAddress("");
        setSelectedItem(null);
        setDisabled(false);
        Speech.speak("삭제 성공");
      } else {
        Speech.speak("삭제 실패");
      }
    } catch (err) {
      console.log("err", err);
    } finally {
      setIsEditModalVisible(false);
    }
  };

  const onPressModalOpen = () => {
    Speech.speak("추가");
    setIsModalVisible(true);
  };

  const onPressModalClose = () => {
    setName("");
    setAddress("");
    setEditName("");
    setEditAddress("");
    setSelectedItem(null);
    setIsModalVisible(false);
    setIsEditModalVisible(false);
  };

  const handlePress = (item) => {
    setSelectedItem(item);
    setEditName(item.name);
    setEditAddress(item.address);
    setIsEditModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 3 }}>
        <Header />
      </View>

      <View style={{ flex: 2 }}>
        <CRUD onAdd={onPressModalOpen} />
      </View>

      <View style={{ flex: 8, flexDirection: "column" }}>
        <FavoritesList favoriteList={favoriteList} onItemPress={handlePress} />
      </View>

      <AddModal
        visible={isModalVisible}
        onClose={onPressModalClose}
        onSave={handleSave}
        name={name}
        setName={setName}
        address={address}
        setAddress={setAddress}
      />

      <EditModal
        visible={isEditModalVisible}
        onClose={onPressModalClose}
        onSave={handleChange}
        onDelete={handleDelete}
        name={editName}
        setName={setEditName}
        address={editAddress}
        setAddress={setEditAddress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flex: 1,
    justifyContent: "center",
  },
  CRUD: {
    flex: 1,
    justifyContent: "center",
  },
  button: {
    justifyContent: "center",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  CRUDiconArea: {
    flex: 1,
    alignItems: "center",
  },
  CRUDtextArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  CRUDtext: {
    flex: 3,
    justifyContent: "center",
    fontSize: 30,
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 20,
  },
  textContainer: {
    flex: 3,
    justifyContent: "center",
  },
  favoriteslist: {
    flex: 2,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  favoriteName: {
    fontSize: 35,
    color: "#FFFFFF",
    textAlign: "center",
  },
  favoriteAddress: {
    fontSize: 35,
    color: "#FFFFFF",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    backgroundColor: "#121212",
  },
  modalInput: {
    fontSize: 30,
    backgroundColor: "#2C2C2C",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#121212",
    borderRadius: 8,
    padding: 10,
  },
  favoriteListButton: {
    backgroundColor: "#2C2C2C",
    color: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#121212",
    borderRadius: 8,
  },
});

export default Favorites;
