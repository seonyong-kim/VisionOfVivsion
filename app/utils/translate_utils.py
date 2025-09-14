import re, requests
from requests.adapters import HTTPAdapter, Retry

session = requests.Session()
retries = Retry(total=3, backoff_factor=0.3,
                status_forcelist=[429,500,502,503,504],
                allowed_methods=["POST","GET"])
session.mount("https://", HTTPAdapter(max_retries=retries))

TRANSLATE_TIMEOUT = 5

def english_ratio(text):
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total_chars = len(text)
    return english_chars / total_chars if total_chars > 0 else 0.0

def split_into_sentences(text):
    return [s.strip() for s in re.split(r'(?<=[.?!])\s+', text.strip()) if s.strip()]

def translate_batch_with_google(sentences, api_key, target="ko"):
    if not sentences: return []
    url = "https://translation.googleapis.com/language/translate/v2"
    data = {"target": target, "format": "text", "key": api_key, "q": sentences}
    r = session.post(url, data=data, timeout=TRANSLATE_TIMEOUT)
    r.raise_for_status()
    trans = r.json()["data"]["translations"]
    return [t.get("translatedText", s) for t, s in zip(trans, sentences)]

def translate_paragraph_by_sentence(paragraph, api_key, threshold=0.3, target="ko"):
    sents = split_into_sentences(paragraph)
    idxs = [i for i,s in enumerate(sents) if english_ratio(s) >= threshold]
    if not idxs: return "\n".join(sents)
    batch = [sents[i] for i in idxs]
    outs = translate_batch_with_google(batch, api_key, target)
    for j,i in enumerate(idxs): sents[i] = outs[j]
    return "\n".join(sents)
