import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const AddButton = ({ onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <View style={styles.buttonInner}>
      <MaterialCommunityIcons
        name="plus-circle-outline"
        size={40}
        color="#FFFFFF"
      />
      <Text style={styles.text}>추가</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 30,
    color: "#FFFFFF",
    marginLeft: 10,
  },
});

export default AddButton;
