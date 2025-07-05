import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Tutorial = () => {
  return (
    <View style={styles.container}>
      <Text>이곳은 시작 화면입니다.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
  },
});

export default Tutorial;



