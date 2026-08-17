import io
from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class StorageClient:
    BUCKET_NAME = "adplatform-assets"

    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.BUCKET_NAME):
                self.client.make_bucket(self.BUCKET_NAME)
        except Exception:
            # Fallback gracefully if MinIO connection is initializing
            pass

    def upload_bytes(
        self,
        object_name: str,
        data: bytes,
        content_type: str = "video/mp4",
    ) -> str:
        self._ensure_bucket_exists()
        data_stream = io.BytesIO(data)
        self.client.put_object(
            bucket_name=self.BUCKET_NAME,
            object_name=object_name,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )
        return self.get_url(object_name)

    def get_url(self, object_name: str) -> str:
        protocol = "https" if settings.MINIO_SECURE else "http"
        return f"{protocol}://{settings.MINIO_ENDPOINT}/{self.BUCKET_NAME}/{object_name}"

    def delete_object(self, object_name: str) -> None:
        try:
            self.client.remove_object(self.BUCKET_NAME, object_name)
        except Exception:
            pass


storage_client = StorageClient()
