import os
import uuid
import mimetypes
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()

import boto3
from botocore.config import Config

R2_ACCOUNT_ID = os.environ["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET = os.environ["R2_BUCKET"]
R2_PUBLIC_BASE_URL = os.environ["R2_PUBLIC_BASE_URL"].rstrip("/")

R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

_s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_MB = 8

def _guess_ext(content_type: str) -> str:
    if content_type == "image/jpeg":
        return ".jpg"
    if content_type == "image/png":
        return ".png"
    if content_type == "image/webp":
        return ".webp"
    ext = mimetypes.guess_extension(content_type) or ""
    return ext if ext.startswith(".") else ""

def create_avatar_upload_urls(auth0_sub: str, content_type: str, file_size_bytes: int | None):
    if content_type not in ALLOWED_IMAGE_MIME:
        raise ValueError("Unsupported content_type. Use image/jpeg, image/png, or image/webp.")

    if file_size_bytes is not None:
        if file_size_bytes <= 0:
            raise ValueError("file_size_bytes must be > 0")
        if file_size_bytes > MAX_UPLOAD_MB * 1024 * 1024:
            raise ValueError(f"File too large. Max {MAX_UPLOAD_MB}MB")

    safe_sub = auth0_sub.replace("|", "_")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    rand = uuid.uuid4().hex[:12]
    ext = _guess_ext(content_type)

    object_key = f"avatars/{safe_sub}/{stamp}_{rand}{ext}"

    upload_url = _s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": R2_BUCKET, "Key": object_key, "ContentType": content_type},
        ExpiresIn=60,
    )

    public_url = f"{R2_PUBLIC_BASE_URL}/{object_key}"
    return upload_url, public_url, object_key