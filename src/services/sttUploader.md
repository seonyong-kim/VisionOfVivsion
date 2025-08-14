// services/sttUploader.js
import EventEmitter from "eventemitter3";
import { segmentRecorder } from "./segmentRecorder";

const DEFAULTS = {
  endpoint: "http://10.43.139.2:5000/stt/segment", // ★ 서버 새 엔드포인트
  language: "ko",
  timeoutMs: 12000,
};

class STTUploader extends EventEmitter {
  constructor() {
    super();
    this._cfg = { ...DEFAULTS };
    this._running = false;
    this._inflight = false;

    this._onSeg = this._onSeg.bind(this);
  }

  configure(cfg = {}) {
    this._cfg = { ...this._cfg, ...cfg };
    this.emit("config", this._cfg);
  }

  start() {
    if (this._running) return;
    this._running = true;
    segmentRecorder.on("segment", this._onSeg);
    this.emit("state", "running");
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    segmentRecorder.off("segment", this._onSeg);
    this._inflight = false;
    this.emit("state", "idle");
  }

  async _onSeg(seg) {
    if (!this._running || this._inflight) return;
    this._inflight = true;

    const { endpoint, language, timeoutMs } = this._cfg;
    const fd = new FormData();
    fd.append("language", language);
    fd.append("segment_seq", String(seg.seq));
    fd.append("duration_ms", String(seg.durationMs ?? 0));
    fd.append("created_at", String(seg.createdAt));
    fd.append("audio", {
      uri: seg.uri,
      name: `seg-${seg.seq}.m4a`,  // Expo Go = m4a
      type: "audio/m4a",
    });

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(t);

      const ok = res.ok;
      const data = ok ? await res.json().catch(() => ({})) : null;
      if (!ok) throw new Error(`HTTP ${res.status}`);

      this.emit("response", { ok: true, data, seg });
    } catch (err) {
      clearTimeout(t);
      this.emit("response", { ok: false, error: String(err), seg });
    } finally {
      this._inflight = false;
    }
  }
}

export const sttUploader = new STTUploader();