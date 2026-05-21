import cv2
import numpy as np
import torch
from typing import Any
from pytorch_grad_cam import EigenCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from utils.logger import get_logger

logger = get_logger(__name__)

class YOLOWrapper(torch.nn.Module):
        def __init__(self, model: Any) -> None:
            super().__init__()
            self.model = model

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            output = self.model(x)
            if isinstance(output, (tuple, list)):
                return output[0]
            return output

def generate_eigencam(model, image_path: str, output_path: str) -> str:
    img_bgr = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_normalize = np.float32(img_rgb) / 255.0

    img_resized = cv2.resize(img_normalize, (640, 640))
    img_tensor = torch.from_numpy(img_resized).permute(2, 0, 1).unsqueeze(0)

    pytorch_model = model.model
    pytorch_model.eval()
    target_layers = [pytorch_model.model[-2]]
        
    wrapped = YOLOWrapper(pytorch_model)
    with torch.no_grad():
        with EigenCAM(model=wrapped, target_layers=target_layers) as cam:
            grayscale_cam = cam(input_tensor=img_tensor)[0]

    cam_image = show_cam_on_image(img_resized, grayscale_cam, use_rgb=True)
    cam_bgr = cv2.cvtColor(cam_image, cv2.COLOR_RGB2BGR)

    h, w = img_bgr.shape[:2]
    cam_resized = cv2.resize(cam_bgr, (w, h))
    cv2.imwrite(output_path, cam_resized)

    logger.info(f"Gradcam saved at: {output_path}")
    return output_path
