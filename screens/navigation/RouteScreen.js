import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import RouteMap from "../../components/navigation/RouteMap";
import { fetchPedestrianRoute } from "../../utils/navigation/tmap";
import { speakText } from "../../utils/tts";

const RouteScreen = ({ route, navigation }) => {
  const { currentLocation, destination, destinationCoords } = route.params;
  const [duration, setDuration] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });

    const getRoute = async () => {
      if (!currentLocation) {
        setError("현재 위치 정보가 없습니다.");
        setIsLoading(false);
        return;
      }

      if (!destinationCoords) {
        setError("목적지 좌표 정보가 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const endX = destinationCoords.longitude;
        const endY = destinationCoords.latitude;

        console.log("경로 요청 시작:", {
          start: `${currentLocation.longitude}, ${currentLocation.latitude}`,
          end: `${endX}, ${endY}`,
          destination,
        });

        const result = await fetchPedestrianRoute(
          currentLocation.longitude,
          currentLocation.latitude,
          endX,
          endY,
          "현재 위치",
          destination
        );

        if (!result.features || result.features.length === 0) {
          throw new Error("경로를 찾을 수 없습니다.");
        }

        const { totalTime, totalDistance } = result.features[0].properties;
        setDuration(Math.round(totalTime / 60));
        setDistance(totalDistance);

        const estimatedMinutes = Math.round(totalTime / 60);
        if (estimatedMinutes > 30) {
          speakText(
            `예상 소요시간은 ${estimatedMinutes}분입니다. 대중교통 이용을 권장합니다. 이전 화면으로 돌아갑니다.`
          );
          setTimeout(() => {
            navigation.navigate("NavigationScreen");
          }, 3500);
          return;
        }

        speakText(
          `${destination}까지 안내를 시작합니다. 예상 소요시간은 ${estimatedMinutes}분입니다.`
        );
      } catch (err) {
        console.error("경로 요청 실패:", err);
        setError(err.message);
        speakText("경로를 불러오지 못했습니다. 다시 시도해 주세요.");

        Alert.alert("경로 오류", err.message || "경로를 불러오지 못했습니다.", [
          { text: "뒤로 가기", onPress: () => navigation.goBack() },
          { text: "다시 시도", onPress: () => getRoute() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    getRoute();
  }, [currentLocation, destinationCoords, navigation]);

  const handleCountdownEnd = () => {
    if (duration !== null && duration > 30) {
      navigation.navigate("MainTabs", { screen: "Navigation" });
      return;
    }
    setTimeout(() => {
      navigation.navigate("Guide", {
        currentLocation,
        destination,
        destinationCoords,
        duration,
        distance,
      });
    }, 1000);
  };

  return (
    <RouteMap
      destination={destination}
      duration={duration}
      distance={distance}
      currentLocation={currentLocation}
      destinationCoords={destinationCoords}
      onCountdownEnd={handleCountdownEnd}
      error={error}
      isLoading={isLoading}
    />
  );
};

export default RouteScreen;
