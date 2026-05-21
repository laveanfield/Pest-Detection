from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from db.database import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
    mAP50 = Column(Float, nullable=True)
    mAP50_95 = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())