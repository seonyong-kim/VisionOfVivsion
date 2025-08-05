// 실시간 카메라 + YOLO로 위험 감지 → 위험 텍스트 & 진동 & TTS
// React와 필요한 컴포넌트들을 import
import React, { useState, useEffect, useRef } from 'react';
// React Native의 기본 UI 컴포넌트들을 import
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';  // ← CameraView 로 변경
import * as Location from 'expo-location';
// 커스텀 컴포넌트들을 import
//import CameraView from '../components/CameraView';
import OverlayWarning from '../../components/navigation/OverlayWarning'
// TTS(Text-to-Speech) 기능을 위한 유틸리티 함수 import
import { speakText } from '../../utils/tts';
import * as Speech from 'expo-speech';
import { fetchPedestrianRoute } from '../../utils/navigation/tmap';
import { TMAP_API_KEY } from '@env';

/**
 * GuideScreen 컴포넌트
 * 실시간 카메라를 통해 YOLO 객체 감지 시뮬레이션을 제공하는 화면
 * 위험 감지 시 경고 오버레이, 진동, TTS 알림을 표시
 */
const GuideScreen = ({ route, navigation }) => {
  // RouteScreen에서 전달받은 파라미터들
  const { currentLocation, destination, destinationCoords, duration, distance } = route.params || {};
  
  // 위험 상태를 관리하는 state (boolean)
  const [danger, setDanger] = useState(false);
  // 감지된 객체의 라벨을 저장하는 state (string)
  const [label, setLabel] = useState('');
  // 카메라 준비 상태를 관리하는 state
  const [cameraReady, setCameraReady] = useState(false);
  const [lastSentLocation, setLastSentLocation] = useState(null); // 마지막 전송 위치
  const [pointDescription, setPointDescription] = useState(''); // Point의 description
  const [pointLocation, setPointLocation] = useState(null); // Point의 좌표
  const [guidePoints, setGuidePoints] = useState([]); // 안내할 포인트 목록
  const [announcedPoints, setAnnouncedPoints] = useState({}); // 안내 완료 플래그 (좌표 문자열로 관리)
  const [isNavigatingHome, setIsNavigatingHome] = useState(false); // 홈 이동 중 여부
  const [nextPointDistance, setNextPointDistance] = useState(null); // 다음 안내 포인트까지의 거리
  const [destinationDistance, setDestinationDistance] = useState(null); // 목적지까지의 거리
  
  // guidePoints, announcedPoints를 ref로 관리
  const guidePointsRef = useRef([]);
  const announcedPointsRef = useRef({});
  // 경로 이탈 감지용 ref
  const prevMinDistRef = useRef(null);
  const prevClosestPointRef = useRef(null);
  const isRecalculatingRef = useRef(false);

  useEffect(() => {
    guidePointsRef.current = guidePoints;
  }, [guidePoints]);
  useEffect(() => {
    announcedPointsRef.current = announcedPoints;
  }, [announcedPoints]);

  // 카메라 권한 훅 사용
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    // 1. 길찾기 시작 시(최초 1회) TMAP API 호출
    const fetchRouteOnce = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;
        setLastSentLocation(coords);
        const startX = coords.longitude;
        const startY = coords.latitude;
        const endX = destinationCoords ? destinationCoords.longitude : 126.95;
        const endY = destinationCoords ? destinationCoords.latitude : 37.384;
        const data = await fetchPedestrianRoute(
          startX, startY, endX, endY, '출발지', destination || '도착지'
        );
        console.log('TMAP API 응답 전체:', data);
        if (data && Array.isArray(data.features)) {
          const points = data.features
            .filter(f => f.geometry?.type === 'Point' && f.properties?.description)
            .map(f => ({
              description: f.properties.description,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
            }));
          setGuidePoints(points);
          console.log('추출된 안내 포인트:', points);
        }
      } catch (e) {
        console.error('경로 요청 실패:', e);
      }
    };

    fetchRouteOnce();

    // 2. 5초마다 내 위치만 받아와서 안내 포인트와 비교
    const checkAndAnnouncePoints = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;
        setLastSentLocation(coords);
        
        // Point와의 거리 계산 및 안내
        if (guidePointsRef.current.length > 0) {
          // 1. 아직 안내되지 않은 Point들만 필터링
          const unannouncedPoints = guidePointsRef.current.filter(point => {
            const key = `${point.latitude},${point.longitude}`;
            return !announcedPointsRef.current[key];
          });

          // 2. 아직 안내되지 않은 Point들과의 거리 계산
          if (unannouncedPoints.length > 0) {
            const dists = unannouncedPoints.map(point =>
              getDistanceFromLatLonInMeters(
                coords.latitude, coords.longitude,
                point.latitude, point.longitude
              )
            );
            
            // 3. 가장 가까운 다음 안내 포인트 찾기
            let minDist = Math.min(...dists);
            let closestIdx = dists.findIndex(d => d === minDist);
            let closestPoint = unannouncedPoints[closestIdx]; // 가장 가까운 포인트

            // 다음 안내 포인트까지의 거리 업데이트
            setNextPointDistance(Math.max(0, Math.round(minDist - 14)));

            // 4. 경로 이탈 감지 (이전보다 멀어지면) - 아직 안내되지 않은 포인트들에 대해서만
            if (
              prevMinDistRef.current !== null &&
              prevClosestPointRef.current !== null &&
              !isRecalculatingRef.current &&
              closestPoint.latitude === prevClosestPointRef.current.latitude &&
              closestPoint.longitude === prevClosestPointRef.current.longitude &&
              minDist - prevMinDistRef.current > 30 // 30m 이상 멀어지면 이탈로 간주
            ) {
              console.log(`[경로 이탈 감지] 이전 거리: ${prevMinDistRef.current}m, 현재 거리: ${minDist}m, 차이: ${minDist - prevMinDistRef.current}m`);
              isRecalculatingRef.current = true;
              console.log('[경로 이탈] 경로를 이탈하였습니다. 경로를 재탐색합니다.');
              setPointDescription('경로를 이탈하였습니다. 경로를 재탐색합니다.'); // 경로 이탈 안내 메시지 출력
              speakText('경로를 이탈하였습니다. 경로를 재탐색합니다.');
              Vibration.vibrate(1000);
              // 현재 위치 기준으로 경로 재탐색
              const startX = coords.longitude;
              const startY = coords.latitude;
              
              // destinationCoords가 없으면 경로 재탐색을 하지 않음
              if (!destinationCoords) {
                console.log('[경로 재탐색 실패] 목적지 좌표가 없습니다.');
                isRecalculatingRef.current = false;
                return;
              }
              
              const endX = destinationCoords.longitude;
              const endY = destinationCoords.latitude;
              try {
                const data = await fetchPedestrianRoute(
                  startX, startY, endX, endY, '출발지', destination || '도착지'
                );
                console.log('[경로 재탐색] TMAP API 응답:', data);
                if (data && Array.isArray(data.features)) {
                  const points = data.features
                    .filter(f => f.geometry?.type === 'Point' && f.properties?.description)
                    .map(f => ({
                      description: f.properties.description,
                      latitude: f.geometry.coordinates[1],
                      longitude: f.geometry.coordinates[0],
                    }));
                  setGuidePoints(points);
                  setAnnouncedPoints({});
                  // 경로 재탐색 후 이탈 감지 초기화
                  prevMinDistRef.current = null;
                  prevClosestPointRef.current = null;
                  isRecalculatingRef.current = false;
                }
              } catch (e) {
                console.error('[경로 재탐색 실패]', e);
                isRecalculatingRef.current = false;
              }
              return;
            }
            // 5. 이탈이 아니면 거리 추적값 갱신
            prevMinDistRef.current = minDist;
            prevClosestPointRef.current = closestPoint;
          } else {
            // 모든 포인트를 안내 완료했으면 거리 정보 초기화
            setNextPointDistance(null);
          }

          guidePointsRef.current.forEach(point => {
            const key = `${point.latitude},${point.longitude}`;
            const dist = getDistanceFromLatLonInMeters(
              coords.latitude, coords.longitude,
              point.latitude, point.longitude
            );
            // 거리 비교 로그
            console.log(`[거리 비교] 현재 위치와 Point(${point.description})의 거리: ${dist.toFixed(2)}m`);
            if (!announcedPointsRef.current[key]) {
              if (dist <= 15) {
                console.log(`[안내 발생] Point 도착! 안내: ${point.description}, 좌표:`, point);
                setPointDescription(point.description); // 안내 텍스트 갱신
                speakText(point.description);
                // Point 안내 시 짧은 진동
                Vibration.vibrate(500);
                setAnnouncedPoints(prev => ({ ...prev, [key]: true }));
                
                // 목적지 도착 확인 (point.description이 '도착'인 경우)
                if (point.description.includes('도착')) {
                  console.log('[목적지 도착] 안내 종료 및 HomeScreen으로 이동');
                  // 모든 안내 관련 변수 초기화
                  setGuidePoints([]);
                  setAnnouncedPoints({});
                  setLastSentLocation(null);
                  setPointDescription('목적지에 도착하였습니다. 길안내를 종료합니다.'); // 안내 종료 메시지
                  // 목적지 도착 안내 음성
                  speakText('목적지에 도착하였습니다. 길안내를 종료합니다. 기본 모드로 전환합니다.');
                  // 목적지 도착 시 긴 진동
                  Vibration.vibrate(2000);
                  // 목적지 도착 시 모든 안내 중단
                  isMounted = false;
                  if (intervalId) clearInterval(intervalId);
                  if (distanceIntervalId) clearInterval(distanceIntervalId); // 거리 업데이트 중단
                  // 안내 종료 음성 출력 후 홈 이동 상태로 설정
                  setTimeout(() => {
                    setIsNavigatingHome(true);
                  }, 3000);
                  // 5초 후 HomeScreen(탭)으로 이동
                  setTimeout(() => {
                    navigation.navigate('MainTabs', { screen: 'Home' });
                  }, 5000);
                }
              }
            }
          });
        }
      } catch (e) {
        console.error('위치 전송 실패:', e);
      }
    };

    // 거리 정보만 1초마다 업데이트하는 함수
    const updateDistances = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;
        
        // 목적지까지의 거리 계산
        if (destinationCoords) {
          const destDist = getDistanceFromLatLonInMeters(
            coords.latitude, coords.longitude,
            destinationCoords.latitude, destinationCoords.longitude
          );
          setDestinationDistance(Math.round(destDist));
        }
        
        // 다음 안내 포인트까지의 거리 계산
        if (guidePointsRef.current.length > 0) {
          const unannouncedPoints = guidePointsRef.current.filter(point => {
            const key = `${point.latitude},${point.longitude}`;
            return !announcedPointsRef.current[key];
          });
          
          if (unannouncedPoints.length > 0) {
            const dists = unannouncedPoints.map(point =>
              getDistanceFromLatLonInMeters(
                coords.latitude, coords.longitude,
                point.latitude, point.longitude
              )
            );
            
            let minDist = Math.min(...dists);
            setNextPointDistance(Math.max(0, Math.round(minDist - 14)));
          } else {
            setNextPointDistance(null);
          }
        }
      } catch (e) {
        console.error('거리 업데이트 실패:', e);
      }
    };

    intervalId = setInterval(() => {
      if (isMounted) checkAndAnnouncePoints();
    }, 5000);

    // 거리 정보를 1초마다 업데이트
    const distanceIntervalId = setInterval(() => {
      if (isMounted) updateDistances();
    }, 1000);

    checkAndAnnouncePoints();
    updateDistances(); // 초기 실행

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (distanceIntervalId) clearInterval(distanceIntervalId);
      Speech.stop(); // 모든 음성 안내 중단
    };
  }, []); // 의존성 배열은 빈 배열

  // guidePoints가 바뀌면 안내 플래그만 초기화
  useEffect(() => {
    setAnnouncedPoints({});
  }, [guidePoints]);

  useEffect(() => {
    if (isNavigatingHome) return; // 홈 이동 중에는 안내 음성 출력 금지
    // 화면 진입 시 네비게이션 옵션 설정
    navigation.setOptions({
      //headerShown: false,
      gestureEnabled: false, // 뒤로가기 제스처 비활성화
    });

    // 화면 진입 시 안내 음성
    const welcomeMessage = destination 
      ? `${destination}까지 실시간 안내를 시작합니다. 카메라가 준비되면 실시간 안내가 시작됩니다.`
      : '길찾기 안내를 시작합니다. 카메라가 준비되면 실시간 안내가 시작됩니다.';
    
    speakText(welcomeMessage);

    // 언마운트 시 음성 안내 중단
    return () => {
      Speech.stop();
    };
  }, [destination, navigation, isNavigatingHome]);

  /**
   * YOLO 위험 감지 시뮬레이션 함수
   * 실제 YOLO 모델 대신 버튼 클릭으로 위험 상황을 시뮬레이션
   */
  const simulateYOLO = () => {
    // 감지된 객체 라벨 설정 (예: 경계석 감지)
    const detectedLabel = '경계석 감지';
    // 라벨 state 업데이트
    setLabel(detectedLabel);
    // 위험 상태를 true로 설정하여 경고 오버레이 표시
    setDanger(true);
    // TTS로 위험 상황을 음성으로 알림
    speakText(`위험! ${detectedLabel}`);
    // 1초간 진동으로 위험 상황을 알림
    Vibration.vibrate(1000);
    
    // 3초 후 위험 상태 해제
    setTimeout(() => {
      setDanger(false);
      setLabel('');
    }, 3000);
  };

  const handleCameraReady = () => {
    console.log('📱 GuideScreen: Camera is ready');
    setCameraReady(true);
    // 목적지 도착 후 홈 이동 중이거나 GuideScreen이 언마운트된 경우 음성 출력 금지
    if (isNavigatingHome) return;
    speakText('카메라가 준비되었습니다. 실시간 안내를 시작합니다.');
  };

  // 하버사인 공식: 두 좌표(위도, 경도) 사이 거리(m) 계산
  function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 지구 반지름(m)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  // 권한이 없으면 권한 요청 화면 표시
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
        <Text style={styles.text}>📵 카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>카메라 권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    // 전체 화면을 차지하는 컨테이너
    <View style={{ flex: 1 }}>
      {/* 실시간 카메라 뷰 컴포넌트 */}
      <CameraView 
        style={styles.camera}
        onCameraReady={handleCameraReady}
      >
        {/* 안내 텍스트를 화면 상단에 표시 */}
        {pointDescription !== '' && (
          <View style={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 10,
          }}>
            <Text style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: 22,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginBottom: 5,
            }}>
              {pointDescription}
            </Text>
            {nextPointDistance !== null && (
              <Text style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#FF8C42',
                fontSize: 16,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 6,
                marginBottom: 3,
              }}>
                다음 안내까지 남은 거리: {nextPointDistance}m
              </Text>
            )}
            {destinationDistance !== null && (
              <Text style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#4FC3F7',
                fontSize: 16,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                목적지까지 남은 거리: {destinationDistance}m
              </Text>
            )}
          </View>
        )}
        {/* 위험 상태일 때만 경고 오버레이를 표시 */}
        {danger && <OverlayWarning label={label} />}
        
        {/* 하단 오버레이 컨테이너 */}
        <View style={styles.overlay}>
          {/* 안내 텍스트 */}
          <Text style={styles.text}>
            {cameraReady ? '안내 중...' : '카메라 준비 중...'}
          </Text>
          
          {/* 목적지 정보 표시 */}
          {destination && (
            <Text style={styles.destinationText}>
              목적지: {destination}
            </Text>
          )}
          
          {/* 카메라가 준비되지 않았을 때 로딩 표시 */}
          {!cameraReady && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF8C42" />
              <Text style={styles.loadingText}>카메라 초기화 중...</Text>
            </View>
          )}
          
          {/* YOLO 시뮬레이션 버튼 - 카메라가 준비된 후에만 표시 */}
          {cameraReady && (
            <TouchableOpacity style={styles.button} onPress={simulateYOLO}>
              <Text style={styles.buttonText}>YOLO 위험 감지 시뮬레이션</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  // 카메라 스타일
  camera: {
    flex: 1,
  },
  // 컨테이너 스타일 (권한 요청 화면용)
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  // 하단 오버레이 스타일
  overlay: {
    position: 'absolute', // 절대 위치로 설정
    bottom: 60, // 하단에서 60px 떨어진 위치
    alignSelf: 'center', // 가로 중앙 정렬
    alignItems: 'center', // 내부 요소들을 세로 중앙 정렬
  },
  // 안내 텍스트 스타일
  text: {
    color: '#FFFFFF', // 흰색 텍스트
    fontSize: 18, // 18px 폰트 크기
    marginBottom: 5,
  },
  // 목적지 텍스트 스타일
  destinationText: {
    color: '#FF8C42', // 주황색 텍스트
    fontSize: 16,
    marginBottom: 10,
  },
  // 로딩 컨테이너 스타일
  loadingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  // 로딩 텍스트 스타일
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
  },
  // 버튼 스타일
  button: {
    marginTop: 20, // 상단 여백 20px
    backgroundColor: '#FF8C42', // 주황색 배경
    padding: 12, // 내부 여백 12px
    borderRadius: 8, // 8px 모서리 둥글게
  },
  // 권한 요청 버튼 스타일
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#4FC3F7',
    padding: 15,
    borderRadius: 8,
  },
  // 버튼 텍스트 스타일
  buttonText: {
    color: '#FFFFFF', // 흰색 텍스트
    fontSize: 16, // 16px 폰트 크기
  },
});

// 컴포넌트를 기본 export로 내보내기
export default GuideScreen;