import { useEffect, useRef } from "react";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";

let GLOBAL_RECORDING_LOCK = false;

export function useAutoSTT({ endpoint, segmentMs = 2500, enabled, onResult }) {
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const enabledRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRecording();
    };
  }, []);

  useEffect(() => {
    enabledRef.current = !!enabled;
    if (enabledRef.current) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [enabled]);

  async function startRecording() {
    if (GLOBAL_RECORDING_LOCK) {
      return;
    }
    GLOBAL_RECORDING_LOCK = true;

    try {
      try {
        Speech.stop();
      } catch {}

      const perm = await Audio.requestPermissionsAsync();
      if (!perm?.granted) {
        GLOBAL_RECORDING_LOCK = false;
        return;
      }

      const IosMode =
        Audio?.InterruptionModeIOS?.DoNotMix ??
        Audio?.INTERRUPTION_MODE_IOS_DO_NOT_MIX ??
        1;
      const AndroidMode =
        Audio?.InterruptionModeAndroid?.DoNotMix ??
        Audio?.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX ??
        1;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: IosMode,
        interruptionModeAndroid: AndroidMode,
        playThroughEarpieceAndroid: false,
      });

      await safeStop();

      await delay(120);

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();
      recordingRef.current = rec;

      scheduleNext();
    } catch (err) {
      console.error("녹음 시작 실패@startRecording:", err);
      GLOBAL_RECORDING_LOCK = false;
    }
  }

  function scheduleNext() {
    if (!mountedRef.current || !enabledRef.current) {
      GLOBAL_RECORDING_LOCK = false;
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const rec = recordingRef.current;
        if (!rec) {
          GLOBAL_RECORDING_LOCK = false;
          if (enabledRef.current) startRecording();
          return;
        }

        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        if (uri) {
          await sendAudio(uri);
        }

        if (!mountedRef.current || !enabledRef.current) {
          GLOBAL_RECORDING_LOCK = false;
          return;
        }

        await delay(60);

        const next = new Audio.Recording();
        await next.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        await next.startAsync();
        recordingRef.current = next;

        scheduleNext();
      } catch (e) {
        console.warn("세그먼트 처리 실패:", e);
        GLOBAL_RECORDING_LOCK = false;
        setTimeout(() => {
          if (enabledRef.current && mountedRef.current) startRecording();
        }, 300);
      }
    }, segmentMs);
  }

  async function safeStop() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (rec) {
      try {
        await rec.stopAndUnloadAsync();
      } catch {}
    }
  }

  async function stopRecording() {
    await safeStop();
    GLOBAL_RECORDING_LOCK = false;
  }

  async function sendAudio(uri) {
    try {
      const formData = new FormData();
      formData.append("audio", { uri, name: "speech.m4a", type: "audio/m4a" });
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onResult?.({ text: data.text });
      } else {
        console.warn("STT 서버 응답 실패:", res.status);
      }
    } catch (err) {
      console.error("STT 전송 실패:", err);
    }
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
