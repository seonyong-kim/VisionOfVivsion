// src/services/useAutoSTT.js (또는 .ts)
import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// 전역 락: 동시에 두 개의 Recording이 준비되지 않도록 방지
let GLOBAL_RECORDING_LOCK = false;

export function useAutoSTT({ endpoint, segmentMs = 2500, enabled, onResult }) {
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const enabledRef = useRef(false);

  useEffect(() => {
    console.log("STT 시작");
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRecording(); // 언마운트 시 확실히 정리
    };
  }, []);

  useEffect(() => {
    enabledRef.current = !!enabled;
    if (enabledRef.current) {
      startRecording();
    } else {
      stopRecording();
    }
    // cleanup은 stopRecording이 담당
  }, [enabled]);

  async function startRecording() {
    if (GLOBAL_RECORDING_LOCK) {
      console.log('🎤 startRecording: GLOBAL_RECORDING_LOCK=true → skip');
      return;
    }
    GLOBAL_RECORDING_LOCK = true;

    try {
      // 혹시 TTS가 재생 중이면 중단 (마이크 시작 충돌 방지)
      try { Speech.stop(); } catch {}

      console.log('🎤 권한 요청...');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm?.granted) {
        console.warn('🎤 마이크 권한 거부됨');
        GLOBAL_RECORDING_LOCK = false;
        return;
      }

      console.log('🎤 오디오 모드 설정...');
      // SDK 버전 차이 흡수(옛 상수/새 enum 모두 대응)
      const IosMode =
        Audio?.InterruptionModeIOS?.DoNotMix ??
        Audio?.INTERRUPTION_MODE_IOS_DO_NOT_MIX ?? 1;
      const AndroidMode =
        Audio?.InterruptionModeAndroid?.DoNotMix ??
        Audio?.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX ?? 1;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: IosMode,
        interruptionModeAndroid: AndroidMode,
        playThroughEarpieceAndroid: false,
        // shouldDuckAndroid: 사용 안 함(신규 SDK에서는 interruptionModeAndroid 사용)
      });

      // 남아있을 수 있는 이전 세션 정리
      await safeStop();

      // 화면 전환 직후 경쟁조건 완화
      await delay(120);

      console.log('🎤 첫 세그먼트 준비...');
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      console.log('🎤 녹음 시작...');
      await rec.startAsync();
      recordingRef.current = rec;

      scheduleNext();
    } catch (err) {
      console.error('🎤 녹음 시작 실패@startRecording:', err);
      GLOBAL_RECORDING_LOCK = false;
    }
  }

  function scheduleNext() {
    if (!mountedRef.current || !enabledRef.current) {
      GLOBAL_RECORDING_LOCK = false;
      return;
    }
    // setInterval 대신 setTimeout 루프: 경합/겹침 방지
    timerRef.current = setTimeout(async () => {
      try {
        const rec = recordingRef.current;
        if (!rec) {
          GLOBAL_RECORDING_LOCK = false;
          console.log('🎤 rec 없음 → 재시작');
          if (enabledRef.current) startRecording();
          return;
        }

        // 현재 세그먼트 종료 & 전송
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        if (uri) {
          await sendAudio(uri);
        }

        if (!mountedRef.current || !enabledRef.current) {
          GLOBAL_RECORDING_LOCK = false;
          return;
        }

        // prepare 충돌 회피용 짧은 텀
        await delay(60);

        // 다음 세그먼트 시작
        const next = new Audio.Recording();
        await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await next.startAsync();
        recordingRef.current = next;

        scheduleNext();
      } catch (e) {
        console.warn('🎤 세그먼트 처리 실패:', e);
        GLOBAL_RECORDING_LOCK = false;
        // 짧은 백오프 후 재시작
        setTimeout(() => {
          if (enabledRef.current && mountedRef.current) startRecording();
        }, 300);
      }
    }, segmentMs);
  }

  async function safeStop() {
    // 타이머 중지
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // 녹음 세션 종료
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (rec) {
      try {
        await rec.stopAndUnloadAsync();
      } catch {}
    }
  }

  async function stopRecording() {
    console.log('🎤 stopRecording 호출');
    await safeStop();
    GLOBAL_RECORDING_LOCK = false;
  }

  async function sendAudio(uri) {
    try {
      const formData = new FormData();
      formData.append('audio', { uri, name: 'speech.m4a', type: 'audio/m4a' });
      console.log("🎤 전송 시작:");
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      if (res.ok) {
        console.log("🎤 STT 응답 수신");
        const data = await res.json();
        onResult?.({ text: data.text });
      } else {
        console.warn('STT 서버 응답 실패:', res.status);
      }
    } catch (err) {
      console.error('STT 전송 실패:', err);
    }
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
