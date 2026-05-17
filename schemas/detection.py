from pydantic import BaseModel

class PredictionResponse(BaseModel):
    count: int
    filename: str