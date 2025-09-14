import re, unicodedata, time, os, mimetypes

COMMAND_MAP = {
    "객체 인식": "object_detection",
    "길": "navigation",
    "설정": "settings",
    "시작": "ocr_read",
}

_last_sent_ts = 0.0
_last_sent_text = ""
MIN_GAP_SEC = 2.0

_punct_run = re.compile(r'([,.\u2026…])\1{1,}')
_only_punct = re.compile(r'^[\s,.\u2026…·]+$')
_nonhangul_short = re.compile(r'\b[0-9A-Za-z]{1,3}\b')

def classify_command(text: str) -> str:
    for keyword, action in COMMAND_MAP.items():
        if keyword in text:
            return action
    return "unknown"

def normalize_text(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = _punct_run.sub(r'\1', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def hangul_ratio(s: str) -> float:
    if not s: return 0.0
    total = sum(1 for ch in s if not ch.isspace())
    if total == 0: return 0.0
    han = sum(1 for ch in s if '가' <= ch <= '힣')
    return han / total

def postprocess_text(raw: str, music_mode=False) -> str:
    if not raw or _only_punct.match(raw): return ""
    s = normalize_text(raw)
    s = _nonhangul_short.sub("", s)
    s = re.sub(r'\s+', ' ', s).strip()
    ratio_threshold = 0.25 if music_mode else 0.40
    if hangul_ratio(s) < ratio_threshold: return ""
    if len(s) < 2: return ""
    return s

def should_emit_text(new_text: str) -> bool:
    global _last_sent_ts, _last_sent_text
    now = time.time()
    t = new_text.strip()
    if not t or t == _last_sent_text: return False
    if now - _last_sent_ts < MIN_GAP_SEC: return False
    _last_sent_ts, _last_sent_text = now, t
    return True

def guess_ext(filename: str, mimetype_header: str) -> str:
    ext = os.path.splitext(filename or "")[1]
    if ext: return ext
    guessed = mimetypes.guess_extension(mimetype_header or "")
    return guessed or ".m4a"
