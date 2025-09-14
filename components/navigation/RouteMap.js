import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { TMAP_API_KEY } from "@env";

const RouteMap = ({
  destination,
  duration,
  distance,
  currentLocation,
  destinationCoords,
  onCountdownEnd,
  error,
  isLoading,
  disableCountdown = false,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!disableCountdown && !error && !isLoading) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : prev));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [disableCountdown, error, isLoading]);

  useEffect(() => {
    if (!disableCountdown && countdown === 1) {
      const timeout = setTimeout(() => {
        onCountdownEnd();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [disableCountdown, countdown]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.directionText}>오류 발생</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubText}>경로를 불러오지 못했습니다.</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.directionText}>경로 확인 중...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4FC3F7" />
          <Text style={styles.loadingText}>경로를 계산하고 있습니다</Text>
        </View>
      </View>
    );
  }

  console.log("RouteMap props:", {
    destination,
    duration,
    distance,
    currentLocation,
    destinationCoords,
    error,
    isLoading,
  });

  if (!destinationCoords) {
    console.log("destinationCoords가 없습니다");
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.directionText}>오류 발생</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>목적지 좌표 정보가 없습니다.</Text>
          <Text style={styles.errorSubText}>다시 시도해 주세요.</Text>
        </View>
      </View>
    );
  }

  const tmapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=PPJvzTZ1zg5PFbPCmajGn77jpjUPP3xF1X5dCzhu"></script>
      <style>
        html, body, #map { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          height: 100%; 
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        try {
          // 지도 초기화
          const map = new Tmapv2.Map("map", {
            center: new Tmapv2.LatLng(${currentLocation.latitude}, ${currentLocation.longitude}),
            width: "100%",
            height: "100%",
            zoom: 16
          });

          const start = new Tmapv2.LatLng(${currentLocation.latitude}, ${currentLocation.longitude});
          const end = new Tmapv2.LatLng(${destinationCoords.latitude}, ${destinationCoords.longitude});

          // 마커 생성
          const startMarker = new Tmapv2.Marker({ 
            position: start, 
            map: map,
            label: "출발"
          });
          const endMarker = new Tmapv2.Marker({ 
            position: end, 
            map: map,
            label: "도착"
          });

          // 경로 좌표를 저장할 배열
          let allCoordinates = [start, end];

          // 경로 요청
          fetch("https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "appKey": ""
            },
            body: JSON.stringify({
              startX: ${currentLocation.longitude},
              startY: ${currentLocation.latitude},
              endX: ${destinationCoords.longitude},
              endY: ${destinationCoords.latitude},
              reqCoordType: "WGS84GEO",
              resCoordType: "WGS84GEO",
              startName: "출발지",
              endName: "도착지"
            })
          })
          .then(res => res.json())
          .then(data => {
            const lineArr = [];
            
            if (data.features && Array.isArray(data.features)) {
              data.features.forEach(feature => {
                if (feature.geometry && feature.geometry.type === "LineString" && feature.geometry.coordinates) {
                  feature.geometry.coordinates.forEach(coord => {
                    const latLng = new Tmapv2.LatLng(coord[1], coord[0]);
                    lineArr.push(latLng);
                    allCoordinates.push(latLng);
                  });
                }
              });
            }

            // 경로 라인 생성
            if (lineArr.length > 0) {
              const polyline = new Tmapv2.Polyline({
                path: lineArr,
                strokeColor: "#FF0000",
                strokeWeight: 5,
                map: map
              });

              // 전체 경로를 포함하도록 지도 크기 자동 조정
              if (allCoordinates.length > 0) {
                const bounds = new Tmapv2.LatLngBounds();
                
                // 모든 좌표를 bounds에 추가
                allCoordinates.forEach(coord => {
                  bounds.extend(coord);
                });
                
                // 경로에 여백을 주기 위해 약간 확장
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const latDiff = (ne.lat() - sw.lat()) * 0.1; // 10% 여백
                const lngDiff = (ne.lng() - sw.lng()) * 0.1; // 10% 여백
                
                const expandedBounds = new Tmapv2.LatLngBounds(
                  new Tmapv2.LatLng(sw.lat() - latDiff, sw.lng() - lngDiff),
                  new Tmapv2.LatLng(ne.lat() + latDiff, ne.lng() + lngDiff)
                );
                
                // 지도를 전체 경로에 맞게 조정
                map.fitBounds(expandedBounds);
              }
            }
          })
          .catch(error => {
            console.error('지도 경로 표시 오류:', error);
          });
        } catch (error) {
          console.error('지도 초기화 오류:', error);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.directionText}>현위치 → {destination}</Text>
        {duration && distance && (
          <Text style={styles.infoText}>
            예상 소요시간: {duration}분 | 거리: {distance}m
          </Text>
        )}
      </View>

      <View style={styles.mapContainer}>
        <WebView
          source={{ html: tmapHtml }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView 오류:", nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView HTTP 오류:", nativeEvent);
          }}
          onMessage={(event) => {
            console.log("WebView 메시지:", event.nativeEvent.data);
          }}
        />
      </View>

      {!disableCountdown && !error && !isLoading && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            {countdown}초 후 길 안내를 시작합니다
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    backgroundColor: "#121212",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  directionText: {
    color: "#4FC3F7",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  countdownContainer: {
    backgroundColor: "#121212",
    padding: 16,
    alignItems: "center",
  },
  countdownText: {
    color: "#4FC3F7",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#4FC3F7",
    fontSize: 16,
    marginTop: 16,
  },
});

export default RouteMap;
