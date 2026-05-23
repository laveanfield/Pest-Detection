from sqlalchemy import UUID, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.sql import func
from db.database import Base
from sqlalchemy.orm import relationship

class BatchSummary(Base):
    __tablename__ = "batch_summaries"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    total_images = Column(Integer, default=0)
    finished_images = Column(Integer, default=0)
    failed_images = Column(Integer, default=0)
    total_pest = Column(Integer, default=0)
    thin_pest_total = Column(Integer, default=0)
    round_pest_total = Column(Integer, default=0)
    big_pest_total = Column(Integer, default=0)
    webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship(
        "User",
        back_populates="batch_summaries"
    )