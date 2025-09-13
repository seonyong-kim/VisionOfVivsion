# --- 표준/공용 ---
import os, io, base64, sys, pathlib, subprocess
from pathlib import Path
from PIL import Image
import numpy as np

# --- Flask / SocketIO ---
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit

# ---------------- YOLOv5 코드베이스 준비 ----------------
# 프로젝트 루트 기준으로 yolov5 경로 설정 (깃허브에 폴더가 없어도 자동 clone 시도)
ROOT = Path(__file__).resolve().parents[1]  # .../VisionOfVision
YV5 = ROOT / "yolov5"

if not YV5.exists():
    try:
        print("🔄 yolov5 not found. Cloning ultralytics/yolov5 ...")
        subprocess.run(
            ["git", "clone", "--depth", "1", "https://github.com/ultralytics/yolov5", str(YV5)],
            check=True
        )
        print("✅ yolov5 cloned.")
    except Exception as e:
        raise RuntimeError(
            f"yolov5 폴더가 없습니다. 깃이 없거나 네트워크 문제일 수 있어요.\n"
            f"수동으로 다음을 실행하세요:\n"
            f"cd {ROOT}\n"
            f"git clone https://github.com/ultralytics/yolov5\n"
            f"에러: {e}"
        )

# yolov5 파이썬 모듈 경로 등록
sys.path.append(str(YV5))

from models.common import DetectMultiBackend
from utils.torch_utils import select_device
from utils.augmentations import letterbox
from utils.general import non_max_suppression, scale_boxes, check_img_size

# ---------------- Flask App ----------------
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ---------------- YOLO Load ----------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
device = select_device("0" if (hasattr(os, "name") and os.name != "nt" and False) else "cpu")  # GPU 원하면 "0"
model = DetectMultiBackend(MODEL_PATH, device=device, dnn=False, fp16=False)

# 일부 체크포인트는 stride가 int일 수 있음
try:
    stride = int(model.stride.max())
except Exception:
    stride = int(model.stride)

names = model.names
imgsz = check_img_size(640, s=stride)

CONF_THRES = 0.30
IOU_THRES  = 0.55
MAX_DET    = 300

# 클래스별 이전 최대 면적
prev_areas = {}

def infer_one_rgb(nd_rgb: np.ndarray):
    """HWC RGB numpy -> list[[xmin,ymin,xmax,ymax,conf,cls], ...]"""
    im0 = nd_rgb
    im = letterbox(im0, imgsz, stride=stride, auto=True)[0]
    im = im.transpose((2, 0, 1))  # HWC->CHW
    im = np.ascontiguousarray(im)

    im_tensor = None
    import torch
    im_tensor = torch.from_numpy(im).to(device).float() / 255.0
    if im_tensor.ndim == 3:
        im_tensor = im_tensor[None]  # batch 1

    pred = model(im_tensor, augment=False, visualize=False)

    dets = non_max_suppression(
        pred, conf_thres=CONF_THRES, iou_thres=IOU_THRES,
        classes=None, agnostic=False, max_det=MAX_DET
    )

    out = []
    for det in dets:
        if len(det):
            det[:, :4] = scale_boxes(im_tensor.shape[2:], det[:, :4], im0.shape).round()
            for *xyxy, conf, cls in det.tolist():
                xmin, ymin, xmax, ymax = map(int, xyxy)
                out.append([xmin, ymin, xmax, ymax, float(conf), int(cls)])
    return out

@socketio.on('image')
def handle_image(data):
    global prev_areas
    try:
        header, b64data = data['image'].split(',', 1)
        img_bytes = base64.b64decode(b64data)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img_np = np.array(img)

        det_list = infer_one_rgb(img_np)  # [xmin,ymin,xmax,ymax,conf,cls]
        # 클래스별 최대 면적 선별
        max_area_by_class = {}
        for xmin, ymin, xmax, ymax, conf, cls in det_list:
            area = (xmax - xmin) * (ymax - ymin)
            cname = names[cls] if isinstance(names, (list, tuple)) else names[int(cls)]
            if cname not in max_area_by_class or area > max_area_by_class[cname]:
                max_area_by_class[cname] = area

        detections = []
        for xmin, ymin, xmax, ymax, conf, cls in det_list:
            cname = names[cls] if isinstance(names, (list, tuple)) else names[int(cls)]
            area = (xmax - xmin) * (ymax - ymin)

            approaching = False
            if cname in max_area_by_class and area == max_area_by_class[cname]:
                prev = prev_areas.get(cname, 0.0)
                if prev > 0 and area > prev * 1.3:
                    approaching = True
                prev_areas[cname] = area

            detections.append({
                'bbox': [xmin, ymin, xmax, ymax],
                'class_name': cname,
                'confidence': round(conf, 2),
                'approaching': approaching
            })

        emit('detection', detections)

    except Exception as e:
        print("❌ 처리 중 에러:", e)
        emit('error', {'msg': str(e)})

if __name__ == '__main__':
    # 필요 시: 모델 워밍업 (선택)
    # import torch
    # model(torch.zeros(1, 3, imgsz, imgsz).to(device))
    socketio.run(app, host='0.0.0.0', port=5004)
