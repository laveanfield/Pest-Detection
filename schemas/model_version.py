from pydantic import BaseModel
from datetime import datetime

class ModelVersionCreate(BaseModel):
    name: str
    file_path: str
    description: str | None = None
    mAP50: float | None = None
    mAP50_95: float | None = None

class ModelVersionResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    mAP50: float | None
    mAP50_95: float | None
    created_at: datetime

    class Config:
        from_attributes = True