// services/intentRouter.js
import EventEmitter from "eventemitter3";
import { sttUploader } from "./sttUploader";

// 서버가 못 주는 경우를 대비한 초간단 의도 파악(백업)
const FALLBACK_INTENT_KEYWORDS = {
  OCR_INTENT: ["글자 인식", "문자 인식", "텍스트 인식", "글자 읽어", "텍스트 읽어", "문자 읽어", "ocr", "텍스트 읽기", "글자 읽기"],
  SEARCH_INTENT: ["객체 인식", "물체 인식", "찾아줘", "검색해"],
  NAVIGATION_INTENT: ["길 찾기", "네비게이션", "길안내", "가는 길"],
  SETTING_INTENT: ["설정", "세팅", "setting"],
  CANCEL_INTENT: ["취소", "그만", "중지"],
};
function detectFallbackIntent(text = "") {
  const t = text.toLowerCase();
  for (const [key, kws] of Object.entries(FALLBACK_INTENT_KEYWORDS)) {
    if (kws.some((kw) => t.includes(kw.toLowerCase()))) return key;
  }
  return null;
}

const DEFAULTS = {
  debounceMs: 4000,
  allowBroadcastText: true,
};

class IntentRouter extends EventEmitter {
  constructor() {
    super();
    this._cfg = { ...DEFAULTS };
    this._subs = new Map(); // token -> {intents:Set, handler, priority}
    this._lastAt = new Map(); // intent -> ts
    this._tokenSeq = 0;

    this._onUploaderResp = this._onUploaderResp.bind(this);
    sttUploader.on("response", this._onUploaderResp);
  }

  configure(cfg = {}) {
    this._cfg = { ...this._cfg, ...cfg };
  }

  subscribe({ intents = [], handler, priority = 0 }) {
    if (!intents.length || typeof handler !== "function") {
      throw new Error("subscribe requires intents[] and handler");
    }
    const token = `sub-${++this._tokenSeq}`;
    this._subs.set(token, { intents: new Set(intents), handler, priority });
    this.emit("subs", { size: this._subs.size });
    return token;
  }

  unsubscribe(token) {
    this._subs.delete(token);
    this.emit("subs", { size: this._subs.size });
  }

  _onUploaderResp(evt) {
    if (!evt?.ok) {
      this.emit("error", evt?.error || "upload_failed");
      return;
    }
    const data = evt.data || {};
    let { text, intent, segment_seq } = data;

    if (this._cfg.allowBroadcastText && text) {
      this.emit("text", { text, segmentSeq: segment_seq, ts: Date.now() });
    }

    // 서버가 intent를 못 주면 간단히 추정
    if (!intent && text) intent = detectFallbackIntent(text);
    if (!intent) return;

    // 디바운스
    const now = Date.now();
    const last = this._lastAt.get(intent) || 0;
    if (now - last < this._cfg.debounceMs) {
      this.emit("debug", { type: "debounce_drop", intent, delta: now - last });
      return;
    }

    // 구독자 필터링
    const candidates = [];
    for (const [token, sub] of this._subs.entries()) {
      if (sub.intents.has(intent)) {
        candidates.push({ token, ...sub });
      }
    }
    if (!candidates.length) {
      this.emit("unhandled", { intent, text, segmentSeq: segment_seq });
      return;
    }

    // 우선순위 높은 한 곳에만 전달
    candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const target = candidates[0];

    try {
      target.handler({ intent, text, segmentSeq: segment_seq, ts: now });
      this._lastAt.set(intent, now);
      this.emit("delivered", { intent, to: target.token, priority: target.priority || 0 });
    } catch (e) {
      this.emit("error", `handler_error: ${String(e)}`);
    }
  }
}

export const intentRouter = new IntentRouter();
