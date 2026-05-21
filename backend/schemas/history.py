from pydantic import BaseModel
from datetime import datetime

class HistoryItemResponse(BaseModel):
    id: int
    user_id: str
    batch_id: str | None = None
    status: str
    total_count: int
    created_at: datetime

    class Config:
        from_attributes = True