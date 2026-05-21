from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from db.database import Base

class Detection(Base):
    __tablename__ = "detections"
    
    user_id = Column(String, index=True)
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True)
    batch_id = Column(String, nullable=True, index=True)
    status = Column(String, default="PENDING")
    image_url = Column(String, nullable=True)
    cam_url = Column(String, nullable=True)
    total_count = Column(Integer, default=0)
    thin_pest_count = Column(Integer, default=0)
    round_pest_count = Column(Integer, default=0)
    big_pest_count = Column(Integer, default=0)
    confidence_threshold = Column(Float, default=0.25)
    created_at = Column(DateTime(timezone=True), server_default=func.now())