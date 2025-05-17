import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

const HomeScreen = () => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한이 필요합니다.</Text>
        <Button onPress={requestPermission} title="권한 허용" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 화면이 포커스 되었을 때만 카메라 렌더링 */}
      {isFocused ? (
        <CameraView style={styles.camera} facing={facing} />
      ) : (
        <View style={styles.camera} /> // 빈 뷰로 대체하여 메모리 해제 도움
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { textAlign: 'center', paddingBottom: 10 },
  camera: { flex: 1 },
});

