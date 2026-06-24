import uuid
from typing import BinaryIO
from urllib.parse import urlparse

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from config.settings import Settings
from domain.exceptions import StorageError


class S3Storage:
    def __init__(self, settings: Settings) -> None:
        self._bucket = settings.s3_bucket
        self._public_base_path = settings.s3_public_base_path.strip().rstrip("/")
        self._presign_expires = settings.s3_presign_expires_seconds
        client_kwargs = {
            "aws_access_key_id": settings.s3_access_key,
            "aws_secret_access_key": settings.s3_secret_key,
            "region_name": settings.s3_region,
            "use_ssl": settings.s3_use_ssl,
            "config": Config(signature_version="s3v4"),
        }
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            **client_kwargs,
        )
        public_endpoint = settings.s3_public_endpoint_url or settings.s3_endpoint_url
        if public_endpoint == settings.s3_endpoint_url:
            self._presign_client = self._client
        else:
            self._presign_client = boto3.client(
                "s3",
                endpoint_url=public_endpoint,
                **client_kwargs,
            )

    def ensure_bucket(self) -> None:
        try:
            self._client.head_bucket(Bucket=self._bucket)
        except ClientError:
            self._client.create_bucket(Bucket=self._bucket)

    def upload_fileobj(self, fileobj: BinaryIO, key: str, content_type: str) -> None:
        try:
            self._client.upload_fileobj(
                fileobj,
                self._bucket,
                key,
                ExtraArgs={"ContentType": content_type},
            )
        except ClientError as exc:
            raise StorageError(f"Upload failed: {exc}") from exc

    def delete_object(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except ClientError as exc:
            raise StorageError(f"Delete failed: {exc}") from exc

    def get_object_stream(self, key: str) -> tuple[object, str, int | None]:
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
            content_type = response.get("ContentType") or "model/gltf-binary"
            content_length = response.get("ContentLength")
            return response["Body"], content_type, content_length
        except ClientError as exc:
            raise StorageError(f"Download failed: {exc}") from exc

    def generate_presigned_url(self, key: str, expires_in: int | None = None) -> str:
        try:
            return self._presign_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_in or self._presign_expires,
            )
        except ClientError as exc:
            raise StorageError(f"Presign failed: {exc}") from exc

    def get_public_download_url(self, key: str) -> str | None:
        if not self._public_base_path:
            return None
        presigned = self.generate_presigned_url(key)
        parsed = urlparse(presigned)
        query = f"?{parsed.query}" if parsed.query else ""
        return f"{self._public_base_path}{parsed.path}{query}"

    @staticmethod
    def image_content_type(ext: str) -> str:
        mapping = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
        }
        return mapping.get(ext.lower(), "image/jpeg")

    @staticmethod
    def video_content_type(ext: str) -> str:
        mapping = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mov": "video/quicktime",
            ".mkv": "video/x-matroska",
        }
        return mapping.get(ext.lower(), "video/mp4")

    @staticmethod
    def build_avatar_key(house_id: uuid.UUID, original_filename: str) -> str:
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "jpg"
        if ext not in {"jpg", "jpeg", "png", "webp"}:
            ext = "jpg"
        return f"houses/{house_id}/avatar/{uuid.uuid4()}.{ext}"

    @staticmethod
    def build_video_key(house_id: uuid.UUID, original_filename: str) -> str:
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "mp4"
        if ext not in {"mp4", "webm", "mov", "mkv"}:
            ext = "mp4"
        return f"houses/{house_id}/videos/{uuid.uuid4()}.{ext}"

    @staticmethod
    def build_glb_key(original_filename: str) -> str:
        ext = ".glb" if original_filename.lower().endswith(".glb") else ""
        return f"models/{uuid.uuid4()}{ext or '.glb'}"

    @staticmethod
    def build_photo_key(house_id: uuid.UUID, original_filename: str) -> str:
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "jpg"
        if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
            ext = "jpg"
        return f"houses/{house_id}/photos/{uuid.uuid4()}.{ext}"

    @staticmethod
    def build_key(original_filename: str) -> str:
        return S3Storage.build_glb_key(original_filename)
