// services/segmentRecorder.js
import { Audio } from "expo-av";
import EventEmitter from "eventemitter3";

const DEFAULTS = {
  segmentMs: 5000, // ★ 5초
  recordingPreset: Audio.RecordingOptionsPresets.HIGH_QUALITY, // m4a(AAC)
};

class SegmentRecorder extends EventEmitter {
  constructor() {
    super();
    this._cfg = { ...DEFAULTS };
    this._running = false;
    this._seq = 0;
    this._current = null;
    this._timer = null;
  }

  configure(cfg = {}) {
    this._cfg = { ...this._cfg, ...cfg };
  }

  get isRunning() {
    return this._running;
  }

  async _prepareAudio() {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) throw new Error("MIC permission denied");
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS ?? 2,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS ?? 2,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  }

  async start() {
    if (this._running) return;
    await this._prepareAudio();
    this._running = true;
    this._seq = 0;
    this.emit("state", "starting");
    await this._startNextSegment();
    this.emit("state", "running");
  }

  async stop() {
    if (!this._running) return;
    this._running = false;
    this.emit("state", "stopping");
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._current) {
      try { await this._current.stopAndUnloadAsync(); } catch {}
      this._current = null;
    }
    this.emit("state", "idle");
  }

  async _startNextSegment() {
    if (!this._running) return;

    // 안전장치
    if (this._current) {
      try { await this._current.stopAndUnloadAsync(); } catch {}
      this._current = null;
    }

    const rec = new Audio.Recording();
    try {
      await rec.prepareToRecordAsync(this._cfg.recordingPreset);
      await rec.startAsync();
      this._current = rec;
      const thisSeq = ++this._seq;

      this._timer = setTimeout(async () => {
        let uri = null, durationMs = null;
        try {
          await rec.stopAndUnloadAsync();
          const status = await rec.getStatusAsync();
          uri = rec.getURI();
          durationMs = status?.durationMillis ?? null;
        } catch {}

        if (uri) {
          this.emit("segment", {
            seq: thisSeq,
            uri,
            durationMs,
            createdAt: Date.now(),
          });
        }

        // 다음 세그먼트
        if (this._running) {
          try { await this._startNextSegment(); }
          catch { this._running = false; this.emit("state", "idle"); }
        }
      }, this._cfg.segmentMs);
    } catch (e) {
      this.emit("error", { code: "start_fail", message: String(e) });
      this._running = false;
      this.emit("state", "idle");
    }
  }
}

export const segmentRecorder = new SegmentRecorder();