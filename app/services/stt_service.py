from faster_whisper import WhisperModel
import tempfile, os
from app.utils.stt_utils import postprocess_text, should_emit_text, classify_command, guess_ext

# 모델 로드 (전역 1회)
model = WhisperModel("tiny", device="cpu", compute_type="int8")

def run_stt(audio_file=None, raw_bytes=None, mimetype_header="", music_mode=False):
    tmp_path = None
    try:
        if audio_file:  # multipart 업로드
            ext = guess_ext(audio_file.filename, audio_file.mimetype)
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                audio_file.save(tmp.name)
                tmp_path = tmp.name
        else:  # raw body
            ext = guess_ext("", mimetype_header)
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(raw_bytes)
                tmp.flush()
                tmp_path = tmp.name

        opts = dict(language="ko", task="transcribe", temperature=0.0,
                    beam_size=5, condition_on_previous_text=False, without_timestamps=True)

        if music_mode:
            segments, _ = model.transcribe(tmp_path, vad_filter=False,
                                           no_speech_threshold=0.15,
                                           log_prob_threshold=-1.2,
                                           compression_ratio_threshold=2.6,
                                           **opts)
        else:
            segments, _ = model.transcribe(tmp_path, vad_filter=True,
                                           vad_parameters={"min_silence_duration_ms": 400},
                                           no_speech_threshold=0.25,
                                           log_prob_threshold=-0.7,
                                           **opts)

        raw_text = "".join(seg.text for seg in segments).strip()
        text = postprocess_text(raw_text, music_mode)

        if not should_emit_text(text):
            return {"text": "", "action": "none"}

        return {"text": text, "action": classify_command(text)}

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
