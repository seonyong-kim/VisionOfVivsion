// screens/HomeScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import io from "socket.io-client";
import * as Speech from "expo-speech";
import * as ImageManipulator from "expo-image-manipulator";

const { width: previewWidth, height: previewHeight } = Dimensions.get("window");
const SERVER_URL = "http://192.168.0.23:5000"; // 본인 서버 IP:포트

export default function HomeScreen() {
  const cameraRef = useRef(null);
  const socketRef = useRef(null);
  const isFocused = useIsFocused();

  const [permission, requestPermission] = useCameraPermissions();
  const [detections, setDetections] = useState([]);
  const [photoSize, setPhotoSize] = useState({ width: 1, height: 1 });
  const [frameReady, setFrameReady] = useState(true);

  // 📚 서버에서 받은 모델 클래스 목록
  const [classNames, setClassNames] = useState([]);

  // 🔍 입력/타깃
  const [targetInput, setTargetInput] = useState("");
  const [targetClass, setTargetClass] = useState(""); // 비어있으면 일반 모드

  // 🔊 중복 발화 방지
  const lastSpeakRef = useRef(0);
  const lastGroupsRef = useRef({ left: "", right: "" });

  // 1) Socket.IO 초기화
  useEffect(() => {
    const sock = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = sock;

    sock.on("connect", () => console.log("✅ Socket connected"));
    sock.on("disconnect", () => console.log("❌ Socket disconnected"));
    sock.on("detection", (data) => setDetections(data || []));
    // ⬇️ 서버가 connect 시 내려주는 클래스 목록
    sock.on("class_names", (payload) => {
      const arr = payload?.classes || [];
      setClassNames(arr.map(String));
      console.log("📚 YOLO classes:", arr);
    });

    return () => sock.disconnect();
  }, []);

  // 2) 자동 프레임 전송
  useEffect(() => {
    if (!permission?.granted || !isFocused) return;

    const interval = setInterval(async () => {
      if (!frameReady) return;
      setFrameReady(false);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });

        setPhotoSize({ width: photo.width, height: photo.height });

        const imgData = "data:image/jpeg;base64," + photo.base64;
        socketRef.current.emit("image", {
          image: imgData,
          width: photo.width,
          height: photo.height,
        });
        console.log("📤 Frame sent");
      } catch (e) {
        console.error("🚫 sendFrame error", e);
      } finally {
        setTimeout(() => setFrameReady(true), 1000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [permission, isFocused, frameReady]);

  // 3) 왼쪽/오른쪽 분류 + TTS (targetClass 설정 시 그 클래스만 안내)
  useEffect(() => {
    if (photoSize.width <= 1 || detections.length === 0) return;

    const scaleX = previewWidth / photoSize.width;
    const centerX = previewWidth / 2;
    const norm = (s) => (s || "").trim().toLowerCase();

    const visible = targetClass
      ? detections.filter((d) => {
          const name = norm(d.class_name);
          const tgt = norm(targetClass);
          return name === tgt || name.includes(tgt);
        })
      : detections;

    const leftSet = new Set();
    const rightSet = new Set();

    for (const item of visible) {
      const [xmin, , xmax] = item.bbox;
      const midX = ((xmin + xmax) / 2) * scaleX;
      if (midX < centerX) leftSet.add(item.class_name);
      else rightSet.add(item.class_name);
    }

    const leftArr = Array.from(leftSet);
    const rightArr = Array.from(rightSet);

    const leftStr = leftArr.join(",");
    const rightStr = rightArr.join(",");

    const now = Date.now();
    const cooldownMs = 2500;
    const contentChanged =
      leftStr !== lastGroupsRef.current.left ||
      rightStr !== lastGroupsRef.current.right;
    const timeOk = now - lastSpeakRef.current > cooldownMs;

    if ((leftArr.length || rightArr.length) && contentChanged && timeOk) {
      let msg = "";
      if (leftArr.length > 0 && rightArr.length > 0) {
        msg = `왼쪽에는 ${leftArr.join(", ")} 있고, 오른쪽에는 ${rightArr.join(
          ", "
        )} 있습니다.`;
      } else if (leftArr.length > 0) {
        msg = `왼쪽에 ${leftArr.join(", ")} 있습니다.`;
      } else if (rightArr.length > 0) {
        msg = `오른쪽에 ${rightArr.join(", ")} 있습니다.`;
      }

      if (msg) {
        try {
          Speech.stop();
          Speech.speak(msg, { language: "ko-KR", pitch: 1.0, rate: 2.0 }); // ✅ 2배속
          console.log("🗣️ speak:", msg);
        } catch {}
        lastSpeakRef.current = now;
        lastGroupsRef.current = { left: leftStr, right: rightStr };
      }
    }
  }, [detections, photoSize, targetClass]);

  // 4) 권한 요청 UI
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text onPress={requestPermission} style={styles.link}>
          카메라 권한 요청
        </Text>
      </View>
    );
  }

  // 5) 렌더링
  return (
    <View style={styles.container}>
      {/* 🔘 상단 제어: 찾기/확인/취소 */}
      <View style={styles.searchBar}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            try {
              Speech.stop();
            } catch {}
            Speech.speak("찾을 대상을 입력해 주세요.", {
              language: "ko-KR",
              rate: 2.0,
            });
          }}
        >
          <Text style={styles.btnTxt}>찾기</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="예: wallet, person, traffic light"
          placeholderTextColor="#999"
          value={targetInput}
          onChangeText={setTargetInput}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.btn, styles.btnConfirm]}
          onPress={() => {
            const want = (targetInput || "").trim().toLowerCase();
            if (!want) return;

            // ✅ 서버에서 받은 클래스 목록으로 검증 (부분일치 허용)
            const candidates = classNames.filter((c) =>
              c.toLowerCase().includes(want)
            );
            if (candidates.length === 0) {
              try {
                Speech.stop();
              } catch {}
              Speech.speak("모델에 없는 클래스라서 찾을 수 없습니다.", {
                language: "ko-KR",
                rate: 2.0,
              });
              return;
            }
            const chosen = candidates[0];
            setTargetClass(chosen);
            try {
              Speech.stop();
            } catch {}
            Speech.speak(`${chosen}를 찾는 중입니다.`, {
              language: "ko-KR",
              rate: 2.0,
            });
          }}
        >
          <Text style={styles.btnTxt}>확인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnClear]}
          onPress={() => {
            setTargetClass("");
            setTargetInput("");
            try {
              Speech.stop();
            } catch {}
            Speech.speak("찾기를 종료하고 일반 안내로 돌아갑니다.", {
              language: "ko-KR",
              rate: 2.0,
            });
          }}
        >
          <Text style={styles.btnTxt}>취소</Text>
        </TouchableOpacity>
      </View>

      {isFocused && <CameraView style={styles.camera} ref={cameraRef} />}

      {/* 박스 오버레이: 타깃 설정 시 타깃 강조, 아니면 모두 동일 */}
      {/* <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {detections.map((item, idx) => {
          const scaleX = previewWidth  / photoSize.width;
          const scaleY = previewHeight / photoSize.height;

          const x = item.bbox[0] * scaleX;
          const y = item.bbox[1] * scaleY;
          const w = (item.bbox[2] - item.bbox[0]) * scaleX;
          const h = (item.bbox[3] - item.bbox[1]) * scaleY;

          const isTarget = targetClass
            ? (item.class_name || '').toLowerCase().includes(targetClass.toLowerCase())
            : true;

          const stroke = isTarget ? 'yellow' : 'rgba(0,255,0,0.35)';
          const labelFill = isTarget ? 'yellow' : 'rgba(0,255,0,0.6)';
          const strokeWidth = isTarget ? 3 : 2;

          return (
            <React.Fragment key={idx}>
              <Rect
                x={x} y={y}
                width={w} height={h}
                stroke={stroke} strokeWidth={strokeWidth} fill="transparent"
              />
              <SvgText
                x={x + 4} y={Math.max(12, y - 6)}
                fontSize={14} fontWeight={isTarget ? 'bold' : 'normal'} fill={labelFill}
              >
                {`${item.class_name} (${item.confidence})`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  camera: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  link: { fontSize: 18, color: "#4FC3F7", textDecorationLine: "underline" },

  searchBar: {
    position: "absolute",
    zIndex: 10,
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  btn: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
  },
  btnConfirm: { backgroundColor: "#3367d6" },
  btnClear: { backgroundColor: "#9e2a2a" },
  btnTxt: { color: "#fff", fontWeight: "bold" },
});
