from ultralytics import YOLO
import cv2
import numpy as np

# 모델 불러오기
model = YOLO("yolo12n.pt")  # 또는 yolov8s.pt

# 이미지 로딩 (OpenCV는 BGR로 불러옴)
image_path = "./output/images/image_32.png"
image = cv2.imread(image_path)

# 객체 감지
results = model(image_path)
boxes = results[0].boxes
names = model.names

# bounding box 그리기
for box in boxes:
    cls_id = int(box.cls)
    label = names[cls_id]
    conf = box.conf.item()
    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

    # box 그리기
    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # 라벨 + confidence 텍스트
    text = f"{label} {conf:.2f}"
    cv2.putText(image, text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0, 255, 0), 1)

# 결과 이미지 저장 또는 표시
cv2.imwrite("output_with_boxes.png", image)
# cv2.imshow("Detection", image)
# cv2.waitKey(0)
# cv2.destroyAllWindows()
