import React, { useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, Touchable, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { Header } from 'react-native/Libraries/NewAppScreen';

const OCRScreen = () => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [image, setImage] = useState(null);
  const cameraRef = useRef(null);
  const [disabled, SetDisabled] = useState(false); // 버튼 중복 방지를 위해서

  // 카메라 권한에 필요한 과정
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

// 사진 찍는 함수
  const takePicture = async() =>{
    let photo = null;

    if(cameraRef.current){
      SetDisabled(true); // 버튼 누르면 버튼 비활성화
      photo = await cameraRef.current.takePictureAsync({ base64: false });
      setImage(photo);
      console.log("사진 촬영 결과", photo);
      Speech.speak("글자 인식을 진행합니다. 잠시만 기다려 주세요.", {
        language: 'ko-KR',
        rate: 1.0,
      });
    }

    const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'OCR.jpg',
        type: 'image/jpeg',
      });

    try{
      const response = await fetch('https://8cc3-182-172-19-130.ngrok-free.app/ocr/image', {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type" : "multipart/form-data",
        }
      })
    console.log("전송을 시도합니다");

    if (response.ok) {
      const result = await response.json(); // 서버가 JSON 응답을 줄 경우
      console.log('사진 전송 성공:', result);
      Speech.speak(result.text || '인식된 글자가 없습니다 다시 시도해 주세요.', {
          language: 'ko-KR',
        });
    } else {
      console.warn("서버 응답 실패:", response.status);
      const errorText = await response.text();
      console.warn("서버 응답 내용:", errorText);
    }
    }catch(error){
      console.error("OCR 업로드 실패:", error);
    }
    SetDisabled(false); // 결과 출력되면 버튼 활성화
  }

  // 화면 구성
  return (
    <View style={styles.container}>
      {/* 화면이 포커스 되었을 때만 카메라 렌더링 */}
      {isFocused ? (
        <>
        <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}/>
        {/* CameraView에는 자식 컴포넌트를 둘수 없기 때문에 버튼을 따로 만들어야 한다.*/}
        {/* 카메라와 겹치게 하는 방법이 최선(절대적인 위치를 같게 만든다*/}
        {/*buttonContainer와  button를 참고해서 한다.*/}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style = {styles.button} onPress = {takePicture} disabled={disabled}> 
            <Text style={styles.text}>글자 인식</Text>
          </TouchableOpacity>
        </View>
        </>
      ) : (
        // 빈 뷰로 대체하여 메모리 해제 도와준다. 
        <View style={styles.camera} />
      )}
    </View>
  );
};
/*
*/
export default OCRScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  OCRresult: {
    position: 'absolute',
    fontsize: 24
  },
});