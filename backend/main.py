from fastapi import FastAPI
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator
from db.database import engine, Base
from models.user import User
from models.detection import Detection
from models.model_version import ModelVersion
from models.batch_summary import BatchSummary

Base.metadata.create_all(bind=engine)

import seed_admin

from api.routes import predict,history,stats,auth,models

load_dotenv()

app = FastAPI()

Instrumentator().instrument(app).expose(app)

app.include_router(predict.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(models.router)
app.include_router(auth.router)