import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import OverlayWarning from "../../components/navigation/OverlayWarning";
import { speakText } from "../../utils/tts";
import * as Speech from "expo-speech";
import { fetchPedestrianRoute } from "../../utils/navigation/tmap";
import { TMAP_API_KEY } from "@env";
import * as SecureStore from "expo-secure-store";
import { useIsFocused } from "@react-navigation/native";
import { Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import io from "socket.io-client";

const { width: previewWidth, height: previewHeight } = Dimensions.get("window");
const SERVER_URL = "서버IP";

const ASSIST_SET = new Set([
  "bluesignal",
  "crosswalk",
  "redsignal",
  "braille block",
  "tv",
]);

const GuideScreen = ({ route, navigation }) => {
  const {
    currentLocation,
    destination,
    destinationCoords,
    duration,
    distance,
  } = route.params || {};

  const [danger, setDanger] = useState(false);
  const [label, setLabel] = useState("");

  const [cameraReady, setCameraReady] = useState(false);
  const [lastSentLocation, setLastSentLocation] = useState(null);
  const [pointDescription, setPointDescription] = useState("");
  const [guidePoints, setGuidePoints] = useState([]);
  const [announcedPoints, setAnnouncedPoints] = useState({});
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const [nextPointDistance, setNextPointDistance] = useState(null);
  const [destinationDistance, setDestinationDistance] = useState(null);

  const [heading, setHeading] = useState(null);
  const [bearingToDestination, setBearingToDestination] = useState(null);
  const [relativeAngle, setRelativeAngle] = useState(null);
  const headingSubRef = useRef(null);
  const lastHeadingSpokenAtRef = useRef(0);

  const guidePointsRef = useRef([]);
  const announcedPointsRef = useRef({});
  const prevMinDistRef = useRef(null);
  const prevClosestPointRef = useRef(null);
  const isRecalculatingRef = useRef(false);

  useEffect(() => {
    guidePointsRef.current = guidePoints;
  }, [guidePoints]);
  useEffect(() => {
    announcedPointsRef.current = announcedPoints;
  }, [announcedPoints]);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const socketRef = useRef(null);
  const isFocused = useIsFocused();
  const [detections, setDetections] = useState([]);
  const [photoSize, setPhotoSize] = useState({ width: 1, height: 1 });
  const [frameReady, setFrameReady] = useState(true);
  const [warningVisible, setWarningVisible] = useState(false);
  const ttsTimerRef = useRef(null);

  const lastSpokenMsgRef = useRef("");

  const checkIfAlreadyInFavorites = async (address) => {
    try {
      const deviceId = await SecureStore.getItemAsync("deviceId");
      const url = `서버IP/setting/favorites?device_id=${encodeURIComponent(
        deviceId
      )}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const favorites = await response.json();
        return favorites.some((fav) => fav.address === address);
      }
      return false;
    } catch (error) {
      console.error("즐겨찾기 확인 실패:", error);
      return false;
    }
  };

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    const fetchRouteOnce = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;
        setLastSentLocation(coords);
        const startX = coords.longitude;
        const startY = coords.latitude;
        const endX = destinationCoords ? destinationCoords.longitude : 126.95;
        const endY = destinationCoords ? destinationCoords.latitude : 37.384;

        const data = await fetchPedestrianRoute(
          startX,
          startY,
          endX,
          endY,
          "출발지",
          destination || "도착지"
        );
        if (data && Array.isArray(data.features)) {
          const points = data.features
            .filter(
              (f) => f.geometry?.type === "Point" && f.properties?.description
            )
            .map((f) => ({
              description: f.properties.description,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
            }));
          setGuidePoints(points);
        }
      } catch (e) {
        console.error("경로 요청 실패:", e);
      }
    };

    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== "granted")
          perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== "granted") return;
        headingSubRef.current = await Location.watchHeadingAsync((h) => {
          const deg =
            Number.isFinite(h.trueHeading) && h.trueHeading >= 0
              ? h.trueHeading
              : h.magHeading;
          if (deg != null && !Number.isNaN(deg) && deg >= 0) setHeading(deg);
        });
      } catch (e) {
        console.error("헤딩 구독 실패:", e);
      }
    })();

    const checkAndAnnouncePoints = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;
        setLastSentLocation(coords);

        if (guidePointsRef.current.length > 0) {
          const unannouncedPoints = guidePointsRef.current.filter(
            (p) => !announcedPointsRef.current[`${p.latitude},${p.longitude}`]
          );

          if (unannouncedPoints.length > 0) {
            const dists = unannouncedPoints.map((p) =>
              getDistanceFromLatLonInMeters(
                coords.latitude,
                coords.longitude,
                p.latitude,
                p.longitude
              )
            );
            let minDist = Math.min(...dists);
            let closestIdx = dists.findIndex((d) => d === minDist);
            let closestPoint = unannouncedPoints[closestIdx];
            setNextPointDistance(Math.max(0, Math.round(minDist - 14)));

            if (
              prevMinDistRef.current !== null &&
              prevClosestPointRef.current !== null &&
              !isRecalculatingRef.current &&
              closestPoint.latitude === prevClosestPointRef.current.latitude &&
              closestPoint.longitude ===
                prevClosestPointRef.current.longitude &&
              minDist - prevMinDistRef.current > 30
            ) {
              isRecalculatingRef.current = true;
              setPointDescription(
                "경로를 이탈하였습니다. 경로를 재탐색합니다."
              );
              speakText("경로를 이탈하였습니다. 경로를 재탐색합니다.");
              Vibration.vibrate(1000);

              if (!destinationCoords) {
                isRecalculatingRef.current = false;
                return;
              }

              try {
                const data = await fetchPedestrianRoute(
                  coords.longitude,
                  coords.latitude,
                  destinationCoords.longitude,
                  destinationCoords.latitude,
                  "출발지",
                  destination || "도착지"
                );
                if (data && Array.isArray(data.features)) {
                  const points = data.features
                    .filter(
                      (f) =>
                        f.geometry?.type === "Point" &&
                        f.properties?.description
                    )
                    .map((f) => ({
                      description: f.properties.description,
                      latitude: f.geometry.coordinates[1],
                      longitude: f.geometry.coordinates[0],
                    }));
                  setGuidePoints(points);
                  setAnnouncedPoints({});
                  prevMinDistRef.current = null;
                  prevClosestPointRef.current = null;
                  isRecalculatingRef.current = false;
                }
              } catch (e) {
                console.error("[경로 재탐색 실패]", e);
                isRecalculatingRef.current = false;
              }
              return;
            }

            prevMinDistRef.current = minDist;
            prevClosestPointRef.current = closestPoint;
          } else {
            setNextPointDistance(null);
          }

          for (const point of guidePointsRef.current) {
            const key = `${point.latitude},${point.longitude}`;
            if (!announcedPointsRef.current[key]) {
              const dist = getDistanceFromLatLonInMeters(
                coords.latitude,
                coords.longitude,
                point.latitude,
                point.longitude
              );
              if (dist <= 15) {
                setPointDescription(point.description);
                speakText(point.description);
                Vibration.vibrate(500);
                setAnnouncedPoints((prev) => ({ ...prev, [key]: true }));

                if (point.description.includes("도착")) {
                  setGuidePoints([]);
                  setAnnouncedPoints({});
                  setLastSentLocation(null);
                  setPointDescription(
                    "목적지에 도착하였습니다. 길안내를 종료합니다."
                  );
                  speakText("목적지에 도착하였습니다. 길안내를 종료합니다.");
                  Vibration.vibrate(2000);
                  isMounted = false;
                  if (intervalId) clearInterval(intervalId);
                  if (distanceIntervalId) clearInterval(distanceIntervalId);

                  setTimeout(async () => {
                    if (destination && destinationCoords) {
                      const isAlreadyInFavorites =
                        await checkIfAlreadyInFavorites(destination);
                      if (isAlreadyInFavorites) {
                        setTimeout(
                          () => navigation.navigate("NavigationScreen"),
                          1000
                        );
                      } else {
                        Alert.alert(
                          "즐겨찾기 추가",
                          `${destination}을(를) 즐겨찾기에 추가하시겠습니까?`,
                          [
                            {
                              text: "아니오",
                              style: "cancel",
                              onPress: () =>
                                setTimeout(
                                  () => navigation.navigate("NavigationScreen"),
                                  1000
                                ),
                            },
                            {
                              text: "예",
                              onPress: () => {
                                navigation.navigate("Setting", {
                                  screen: "Favorites",
                                  params: {
                                    addFromNavigation: true,
                                    destinationName: "",
                                    destinationAddress: destination,
                                    destinationCoords: destinationCoords,
                                  },
                                });
                              },
                            },
                          ],
                          { cancelable: false }
                        );
                      }
                    } else {
                      setTimeout(
                        () => navigation.navigate("NavigationScreen"),
                        1000
                      );
                    }
                  }, 3000);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("위치 전송 실패:", e);
      }
    };

    const updateDistances = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;

        if (destinationCoords) {
          const destDist = getDistanceFromLatLonInMeters(
            coords.latitude,
            coords.longitude,
            destinationCoords.latitude,
            destinationCoords.longitude
          );
          setDestinationDistance(Math.round(destDist));

          const bearing = getBearing(
            coords.latitude,
            coords.longitude,
            destinationCoords.latitude,
            destinationCoords.longitude
          );
          setBearingToDestination(bearing);
        }

        if (guidePointsRef.current.length > 0) {
          const unannouncedPoints = guidePointsRef.current.filter(
            (p) => !announcedPointsRef.current[`${p.latitude},${p.longitude}`]
          );
          if (unannouncedPoints.length > 0) {
            const dists = unannouncedPoints.map((p) =>
              getDistanceFromLatLonInMeters(
                coords.latitude,
                coords.longitude,
                p.latitude,
                p.longitude
              )
            );
            let minDist = Math.min(...dists);
            setNextPointDistance(Math.max(0, Math.round(minDist - 14)));
          } else {
            setNextPointDistance(null);
          }
        }
      } catch (e) {
        console.error("거리 업데이트 실패:", e);
      }
    };

    fetchRouteOnce();

    intervalId = setInterval(() => {
      if (isMounted) checkAndAnnouncePoints();
    }, 5000);
    const distanceIntervalId = setInterval(() => {
      if (isMounted) updateDistances();
    }, 1000);

    checkAndAnnouncePoints();
    updateDistances();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (distanceIntervalId) clearInterval(distanceIntervalId);
      if (headingSubRef.current) {
        headingSubRef.current.remove();
        headingSubRef.current = null;
      }
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    setAnnouncedPoints({});
  }, [guidePoints]);

  useEffect(() => {
    if (isNavigatingHome) return;
    navigation.setOptions({ gestureEnabled: false });
    const welcomeMessage = destination
      ? `${destination}까지 실시간 안내를 시작합니다. 카메라가 준비되면 실시간 안내가 시작됩니다.`
      : "길찾기 안내를 시작합니다. 카메라가 준비되면 실시간 안내가 시작됩니다.";
    speakText(welcomeMessage);
    return () => {
      Speech.stop();
    };
  }, [destination, navigation, isNavigatingHome]);

  useEffect(() => {
    if (heading == null || bearingToDestination == null) return;
    const rel = normalizeAngle(bearingToDestination - heading);
    setRelativeAngle(rel);
    if (isNavigatingHome) return;
    const now = Date.now();
    if (
      (rel <= 10 || rel >= 350) &&
      now - lastHeadingSpokenAtRef.current > 5000
    ) {
      speakText("정면 방향입니다. 그대로 진행하세요.");
      lastHeadingSpokenAtRef.current = now;
    }
  }, [heading, bearingToDestination, isNavigatingHome]);

  const handleCameraReady = () => {
    console.log("GuideScreen: Camera is ready");
    setCameraReady(true);
    if (isNavigatingHome) return;
    speakText("카메라가 준비되었습니다. 실시간 안내를 시작합니다.");
  };

  useEffect(() => {
    const sock = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = sock;

    sock.on("connect", () => console.log("Socket connected"));
    sock.on("disconnect", () => console.log("Socket disconnected"));

    sock.on("detection", (data = []) => {
      const arr = Array.isArray(data) ? data : [];
      setDetections(arr);

      const hasDangerApproach = arr.some(
        (d) => d?.approaching && !ASSIST_SET.has(d.class_name)
      );
      if (hasDangerApproach) {
        Vibration.vibrate([0, 300, 120, 300], false);
        setWarningVisible(true);
        setTimeout(() => setWarningVisible(false), 1200);
      }
    });

    return () => sock.disconnect();
  }, []);

  useEffect(() => {
    if (!permission?.granted || !isFocused) return;

    const interval = setInterval(async () => {
      if (!frameReady) return;
      setFrameReady(false);

      try {
        const photo = await cameraRef.current?.takePictureAsync({
          base64: true,
          quality: 0.3,
        });
        if (!photo) return;

        setPhotoSize({ width: photo.width, height: photo.height });
        const imgData = "data:image/jpeg;base64," + photo.base64;

        socketRef.current?.emit("image", {
          image: imgData,
          width: photo.width,
          height: photo.height,
        });
      } catch (e) {
        console.error("sendFrame error", e);
      } finally {
        setTimeout(() => setFrameReady(true), 2000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [permission, isFocused, frameReady]);

  useEffect(() => {
    if (photoSize.width <= 1 || detections.length === 0) return;

    const scaleX = previewWidth / photoSize.width;
    const centerX = previewWidth / 2;

    const danger = [];
    const assist = [];
    for (const d of detections) {
      if (ASSIST_SET.has(d.class_name)) assist.push(d);
      else danger.push(d);
    }

    // 좌/우 분류
    const splitLR = (arr) => {
      const left = new Set();
      const right = new Set();
      for (const it of arr) {
        const [xmin, , xmax] = it.bbox;
        const midX = ((xmin + xmax) / 2) * scaleX;
        (midX < centerX ? left : right).add(it.class_name);
      }
      return [Array.from(left), Array.from(right)];
    };

    const [leftDangerArr, rightDangerArr] = splitLR(danger);
    let dangerMsg = "";
    if (leftDangerArr.length && rightDangerArr.length)
      dangerMsg = `왼쪽에는 ${leftDangerArr.join(
        ", "
      )} 있고, 오른쪽에는 ${rightDangerArr.join(", ")} 있습니다.`;
    else if (leftDangerArr.length)
      dangerMsg = `왼쪽에 ${leftDangerArr.join(", ")} 있습니다.`;
    else if (rightDangerArr.length)
      dangerMsg = `오른쪽에 ${rightDangerArr.join(", ")} 있습니다.`;

    const [leftAssistArr, rightAssistArr] = splitLR(assist);
    let assistMsg = "";
    if (leftAssistArr.length && rightAssistArr.length)
      assistMsg = `보조안내: 왼쪽에는 ${leftAssistArr.join(
        ", "
      )} 있고, 오른쪽에는 ${rightAssistArr.join(", ")} 있습니다.`;
    else if (leftAssistArr.length)
      assistMsg = `보조안내: 왼쪽에 ${leftAssistArr.join(", ")} 있습니다.`;
    else if (rightAssistArr.length)
      assistMsg = `보조안내: 오른쪽에 ${rightAssistArr.join(", ")} 있습니다.`;

    const approachingArr = Array.from(
      new Set(danger.filter((d) => d?.approaching).map((d) => d.class_name))
    );
    const distanceMsg = approachingArr.length
      ? `${approachingArr.join(", ")} 다가오고 있습니다.`
      : "";

    const combined = [dangerMsg, assistMsg, distanceMsg]
      .filter(Boolean)
      .join(" ");
    if (!combined) return;
    if (combined === lastSpokenMsgRef.current) return;

    console.log("🗣️ speak:", combined);
    if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
    ttsTimerRef.current = setTimeout(() => {
      try {
        Speech.stop();
      } catch {}
      Speech.speak(combined, { language: "ko-KR", pitch: 1.0, rate: 2.0 });
      lastSpokenMsgRef.current = combined;
    }, 350);
  }, [detections, photoSize]);

  function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }
  function toDeg(rad) {
    return (rad * 180) / Math.PI;
  }
  function normalizeAngle(deg) {
    return ((deg % 360) + 360) % 360;
  }
  function getBearing(lat1, lon1, lat2, lon2) {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    return normalizeAngle(toDeg(Math.atan2(y, x)));
  }
  function angleToInstruction(angle) {
    const a = normalizeAngle(angle);
    if (a <= 10 || a >= 350) return "정면";
    if (a < 45) return "조금 오른쪽";
    if (a < 135) return "오른쪽";
    if (a < 225) return "뒤쪽";
    if (a < 315) return "왼쪽";
    return "조금 왼쪽";
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>카메라 권한 확인 중...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>카메라 권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onCameraReady={handleCameraReady}
      >
        {pointDescription !== "" && (
          <View
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <Text
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#fff",
                fontSize: 22,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                marginBottom: 5,
              }}
            >
              {pointDescription}
            </Text>
            {nextPointDistance !== null && (
              <Text
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "#FF8C42",
                  fontSize: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginBottom: 3,
                }}
              >
                다음 안내까지 남은 거리: {nextPointDistance}m
              </Text>
            )}
            {destinationDistance !== null && (
              <Text
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "#4FC3F7",
                  fontSize: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                목적지까지 남은 거리: {destinationDistance}m
              </Text>
            )}
          </View>
        )}

        {relativeAngle != null && (
          <View
            style={{
              position: "absolute",
              top: "45%",
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 20,
            }}
          >
            <View
              style={{
                alignItems: "center",
                transform: [{ rotate: `${relativeAngle}deg` }],
              }}
            >
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 22,
                  borderRightWidth: 22,
                  borderBottomWidth: 30,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: "#FF8C42",
                }}
              />
              <View
                style={{
                  width: 10,
                  height: 64,
                  backgroundColor: "#FF8C42",
                  borderRadius: 5,
                  marginTop: -2,
                }}
              />
            </View>
            <Text style={{ color: "#FF8C42", marginTop: 8 }}>
              {angleToInstruction(relativeAngle)}
            </Text>
          </View>
        )}

        {warningVisible && <View style={styles.warningOverlay} />}

        {danger && <OverlayWarning label={label} />}

        <View style={styles.overlay}>
          <Text style={styles.text}>
            {cameraReady ? "안내 중..." : "카메라 준비 중..."}
          </Text>
          {destination && (
            <Text style={styles.destinationText}>목적지: {destination}</Text>
          )}
          {!cameraReady && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF8C42" />
              <Text style={styles.loadingText}>카메라 초기화 중...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  camera: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    alignItems: "center",
  },
  text: { color: "#FFFFFF", fontSize: 18, marginBottom: 5 },
  destinationText: { color: "#FF8C42", fontSize: 16, marginBottom: 10 },
  loadingContainer: { alignItems: "center", marginTop: 10 },
  loadingText: { color: "#FFFFFF", fontSize: 14, marginTop: 10 },
  permissionButton: {
    marginTop: 20,
    backgroundColor: "#4FC3F7",
    padding: 15,
    borderRadius: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16 },
  warningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 0, 0, 0.5)",
    zIndex: 10,
  },
});

export default GuideScreen;
