import base64, io
from PIL import Image
import numpy as np

def base64_to_numpy(b64data: str):
    header, b64 = b64data.split(",", 1)
    img_bytes = base64.b64decode(b64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(img)
