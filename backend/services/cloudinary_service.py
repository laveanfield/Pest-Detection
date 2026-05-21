import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
from utils.logger import get_logger

logger = get_logger(__name__)

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image(file_path: str) -> str:
    logger.info(f"Uploading to Cloudinary...")
    result = cloudinary.uploader.upload(file_path)
    logger.info(f"Upload done.")
    return result["secure_url"]