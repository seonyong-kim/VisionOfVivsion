import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NavigationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Navigation 화면</Text>
      <Text>이곳은 길찾기 화면입니다.</Text>
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

export default NavigationScreen;
