export const fetchPedestrianRoute = async (
  startX,
  startY,
  endX,
  endY,
  startName = "출발지",
  endName = "도착지"
) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(
        "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            appKey: "",
          },
          body: JSON.stringify({
            startX,
            startY,
            endX,
            endY,
            startName,
            endName,
            reqCoordType: "WGS84GEO",
            resCoordType: "WGS84GEO",
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Tmap API 오류: ${res.status} - ${errorText}`);
      }

      const data = await res.json();

      // 응답 데이터 검증
      if (!data.features || data.features.length === 0) {
        throw new Error("경로 정보를 찾을 수 없습니다.");
      }

      return data;
    } catch (err) {
      lastError = err;
      console.error(
        `Tmap API 요청 실패 (시도 ${attempt}/${maxRetries}):`,
        err.message
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error("Tmap 경로 요청 최종 실패:", lastError.message);
  throw lastError;
};

export const geocode = async (address) => {
  try {
    const cleanAddress = address.trim().replace(/\s+/g, " ");

    const res = await fetch(
      `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(
        cleanAddress
      )}&count=10&searchType=all`,
      {
        method: "GET",
        headers: {
          appKey: "PPJvzTZ1zg5PFbPCmajGn77jpjUPP3xF1X5dCzhu",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API 응답 오류:", res.status, errorText);
      throw new Error(`주소 검색 API 오류: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    if (
      data.searchPoiInfo &&
      data.searchPoiInfo.pois &&
      data.searchPoiInfo.pois.poi &&
      data.searchPoiInfo.pois.poi.length > 0
    ) {
      const firstResult = data.searchPoiInfo.pois.poi[0];

      return {
        latitude: parseFloat(firstResult.frontLat),
        longitude: parseFloat(firstResult.frontLon),
        name: firstResult.name,
        address: firstResult.address,
      };
    } else {
      throw new Error("해당 주소를 찾을 수 없습니다.");
    }
  } catch (err) {
    console.error("주소 검색 실패:", err.message);
    throw err;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const res = await fetch(
      `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${latitude}&lon=${longitude}&coordType=WGS84GEO`,
      {
        headers: {
          appKey: "PPJvzTZ1zg5PFbPCmajGn77jpjUPP3xF1X5dCzhu",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`주소 변환 API 오류: ${res.status}`);
    }

    const data = await res.json();

    if (data.addressInfo && data.addressInfo.fullAddress) {
      return data.addressInfo.fullAddress;
    } else {
      throw new Error("주소 정보를 찾을 수 없습니다.");
    }
  } catch (err) {
    console.error("주소 변환 실패:", err.message);
    throw err;
  }
};
