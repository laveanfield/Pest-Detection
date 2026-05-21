from fastapi import FastAPI
from api.routes import predict, history, stats, auth
from db.database import engine, Base
from models.detection import Detection
from models.model_version import ModelVersion
from models.batch_summary import BatchSummary
from dotenv import load_dotenv
from api.routes import models

load_dotenv()

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(predict.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(models.router)
app.include_router(auth.router)