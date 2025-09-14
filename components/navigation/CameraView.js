import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, Alert } from "react-native";
import { Camera } from "expo-camera";

const CameraView = ({ children, onCameraReady }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");

        if (status !== "granted") {
          Alert.alert(
            "카메라 권한 필요",
            "길찾기 기능을 사용하려면 카메라 권한이 필요합니다.",
            [{ text: "확인" }]
          );
        }
      } catch (error) {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleCameraReady = () => {
    setCameraReady(true);
    if (onCameraReady) {
      onCameraReady();
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.camera}>
        <Text style={styles.text}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.camera}>
        <Text style={styles.text}>카메라 권한이 없습니다.</Text>
        <Text style={styles.subText}>설정에서 카메라 권한을 허용해주세요.</Text>
      </View>
    );
  }

  const cameraType = Camera?.Constants?.Type?.back || "back";

  return (
    <Camera
      style={styles.camera}
      ref={cameraRef}
      type={cameraType}
      onCameraReady={handleCameraReady}
    >
      {children}
    </Camera>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  subText: {
    color: "#CCCCCC",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});

export default CameraView;
