from pydantic import BaseModel
from datetime import datetime

class BatchCreateResponse(BaseModel):
    batch_id: str
    total: int
    status: str

class BatchStatusResponse(BaseModel):
    batch_id: str
    total: int
    finished: int
    failed: int
    progress: str

class BatchSummaryResponse(BaseModel):
    id: int
    batch_id: str
    user_id: str | None
    total_images: int
    finished_images: int
    failed_images: int
    total_pest: int
    thin_pest_total: int
    round_pest_total: int
    big_pest_total: int
    created_at: datetime

    class Config:
        from_attributes = True