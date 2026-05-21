from pydantic import BaseModel, model_validator
from datetime import datetime

class PredictCreateResponse(BaseModel):
    id: int
    status: str

class DetectionResultDetail(BaseModel):
    thin_pest: int
    round_pest: int
    big_pest: int

class DetectionResult(BaseModel):
    image_url: str
    cam_url: str | None
    total_count: int
    details: DetectionResultDetail

class DetectionResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    result: DetectionResult | None = None
    message: str | None = None

    @model_validator(mode="before")
    @classmethod
    def build_result(cls, data):
        if hasattr(data, "__dict__"):
            obj = data

            out = {
                "id": obj.id,
                "status": obj.status,
                "created_at": obj.created_at
            }

            if obj.status == "FINISHED":
                out["result"] = {
                    "image_url": obj.image_url,
                    "cam_url": obj.cam_url,
                    "total_count": obj.total_count,
                    "details": {
                        "thin_pest": obj.thin_pest_count,
                        "round_pest": obj.round_pest_count,
                        "big_pest": obj.big_pest_count,
                    }
                }
            elif obj.status == "FAILED":
                out["message"] = "Image processing failed. Please try again."
            return out
        return data
    
    class Config:
        from_attributes = True
