from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db
from models.model_version import ModelVersion
from services.model_registry import ModelRegistry
from schemas.model_version import ModelVersionCreate, ModelVersionResponse

router = APIRouter(prefix="/models", tags=["Model"])

@router.post("/", response_model=ModelVersionResponse)
def register_version(
    payload: ModelVersionCreate, 
    db: Session = Depends(get_db)
):
    version = ModelVersion(**payload.model_dump())

    db.add(version)
    db.commit()
    db.refresh(version)

    return version

@router.get("/", response_model=list[ModelVersionResponse])
def list_versions(db: Session = Depends(get_db)):
    return db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()

@router.patch("/{version_id}/activate")
def activate_version(
    version_id: int,
    db: Session = Depends(get_db)
):
    db.query(ModelVersion).update({"is_active": False})
    version = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    version.is_active = True
    db.commit()
    ModelRegistry.invalidate()
    return {"message": f"Activated version: {version.name}"}