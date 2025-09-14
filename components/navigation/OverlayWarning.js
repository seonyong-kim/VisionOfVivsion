import React from "react";
import { View, Text, StyleSheet } from "react-native";

const OverlayWarning = ({ label }) => {
  if (!label) return null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.text}>위험: {label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(255, 0, 0, 0.85)",
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OverlayWarning;
