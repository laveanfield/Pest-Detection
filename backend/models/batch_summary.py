from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from db.database import Base

class BatchSummary(Base):
    __tablename__ = "batch_summaries"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, unique=True, index=True)
    user_id = Column(String, nullable=True)
    total_images = Column(Integer, default=0)
    finished_images = Column(Integer, default=0)
    failed_images = Column(Integer, default=0)
    total_pest = Column(Integer, default=0)
    thin_pest_total = Column(Integer, default=0)
    round_pest_total = Column(Integer, default=0)
    big_pest_total = Column(Integer, default=0)
    webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())