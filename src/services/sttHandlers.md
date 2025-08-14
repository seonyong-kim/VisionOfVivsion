// 화면별 STT 핸들러 '팩토리'들을 모아두는 파일
// 각 팩토리는 (navigation 등) 의존성과 옵션을 받아서
// { intents, priority, handler } 형태의 구성을 반환합니다.

import * as Speech from "expo-speech";

// 공통 취소 핸들러 (여러 화면에서 재사용 가능)
export function makeCommonCancelHandler({ priority = 5 } = {}) {
  console.log("일단 sttHandler.js까지는 옴");

  return {
    intents: ["CANCEL_INTENT"],
    priority,
    handler: ({ intent }) => {
      if (intent === "CANCEL_INTENT") {
        Speech.speak("취소했어요.", { language: "ko-KR" });
        return true; // 처리 완료 표시(선택적 반환)
      }
    },
  };
}

// OCR 화면 전용
export function makeOCRHandler(navigation, takePicture, {
  priority = 7,
  // 필요시 화면별로 추가/제외 인텐트 설정 가능
  extraIntents = [],     // 추가하고 싶은 인텐트들
  excludeIntents = [],   // 빼고 싶은 인텐트들
} = {}) {
  // 기본 관심 인텐트 세트
  console.log("makeOCRHandler 호출");
  const baseIntents = ["OCR_INTENT", "SEARCH_INTENT", "NAVIGATION_INTENT", "SETTING_INTENT"];

  // include / exclude 적용
  const intents = [...new Set(
    baseIntents
      .concat(extraIntents || [])
      .filter(x => !(excludeIntents || []).includes(x))
  )];

  return {
    intents,
    priority,
    handler: ({ intent, text }) => {
      if (intent === "OCR_INTENT") {
        takePicture();
        return true;
      }
      if (intent === "SEARCH_INTENT") {
        navigation.navigate("Home");
        return true;
      }
      if (intent === "NAVIGATION_INTENT") {
        navigation.navigate("Navigation"); // 임시 매핑
        return true;
      }
      if (intent === "SETTING_INTENT") {
        navigation.navigate("Setting"); // 임시 매핑
        return true;
      }
    },
  };
}

// (예) 길찾기 화면 전용
export function makeRouteHandler(navigation, {
  priority = 6,
  extraIntents = [],
  excludeIntents = [],
} = {}) {
  const baseIntents = ["SEARCH_INTENT", "CANCEL_INTENT"];
  const intents = [...new Set(
    baseIntents
      .concat(extraIntents || [])
      .filter(x => !(excludeIntents || []).includes(x))
  )];

  return {
    intents,
    priority,
    handler: ({ intent, text }) => {
      if (intent === "SEARCH_INTENT") {
        navigation.navigate("RouteScreen");
        return true;
      }
      if (intent === "CANCEL_INTENT") {
        Speech.speak("길찾기를 취소했어요.", { language: "ko-KR" });
        return true;
      }
    },
  };
}
