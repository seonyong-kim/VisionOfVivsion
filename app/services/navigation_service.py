import os, base64, io
import numpy as np
from PIL import Image
import torch
from pathlib import Path
from threading import Lock

from models.common import DetectMultiBackend
from utils.torch_utils import select_device
from utils.augmentations import letterbox
from utils.general import non_max_suppression, scale_boxes, check_img_size

MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
device = select_device("0" if torch.cuda.is_available() else "cpu")

model = DetectMultiBackend(MODEL_PATH, device=device, dnn=False, fp16=False)
stride = int(model.stride.max() if hasattr(model.stride, "max") else model.stride)
names = model.names
imgsz = check_img_size(640, s=stride)

CONF_THRES, IOU_THRES, MAX_DET = 0.3, 0.55, 300
model_lock = Lock()
prev_areas = {}

def infer_one_rgb(nd_rgb: np.ndarray):
    im0 = nd_rgb
    im = letterbox(im0, imgsz, stride=stride, auto=True)[0]
    im = im.transpose((2, 0, 1))
    im = np.ascontiguousarray(im)

    im_tensor = torch.from_numpy(im).to(device).float() / 255.0
    if im_tensor.ndim == 3:
        im_tensor = im_tensor[None]

    with model_lock:
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

def detect_and_track(nd_rgb: np.ndarray):
    global prev_areas
    det_list = infer_one_rgb(nd_rgb)
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

    return detections
