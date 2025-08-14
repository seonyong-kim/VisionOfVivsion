// services/useSTTBootstrap.js
import { useEffect } from "react";
import { AppState } from "react-native";
import { segmentRecorder } from "./segmentRecorder";
import { sttUploader } from "./sttUploader";

export function useSTTBootstrap({
  endpoint,
  language = "ko",
  segmentMs = 5000,   // ★ 5초
  timeoutMs = 12000,
} = {}) {
  useEffect(() => {
    if (!endpoint) return;

    // 구성
    sttUploader.configure({ endpoint, language, timeoutMs });
    segmentRecorder.configure({ segmentMs });

    // 시작
    (async () => {
      try {
        await segmentRecorder.start();
        sttUploader.start();
      } catch (e) {
        console.warn("STT start failed:", e);
      }
    })();

    // 앱 상태별 on/off
    const sub = AppState.addEventListener("change", async (state) => {
      try {
        if (state === "active") {
          if (!segmentRecorder.isRunning) await segmentRecorder.start();
          sttUploader.start();
        } else {
          await segmentRecorder.stop();
          sttUploader.stop();
        }
      } catch {}
    });

    // 정리
    return () => {
      sub.remove();
      sttUploader.stop();
      segmentRecorder.stop();
    };
  }, [endpoint, language, segmentMs, timeoutMs]);
}

