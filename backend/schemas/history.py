from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class HistoryItemResponse(BaseModel):
    id: int
    user_id: UUID | None
    batch_id: str | None = None
    status: str
    image_url: str | None = None
    cam_url: str | None = None
    total_count: int
    thin_pest_count: int
    round_pest_count: int
    big_pest_count: int
    created_at: datetime

    class Config:
        from_attributes = True
