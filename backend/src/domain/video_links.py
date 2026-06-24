import re
from urllib.parse import urlparse

ALLOWED_VIDEO_PLATFORMS = {"youtube", "rutube", "vk"}


class VideoLinkError(ValueError):
    pass


def detect_video_platform(url: str) -> str:
    host = urlparse(url.strip()).netloc.lower().replace("www.", "")
    if host in {"youtube.com", "youtu.be", "m.youtube.com"}:
        return "youtube"
    if host in {"rutube.ru", "m.rutube.ru"}:
        return "rutube"
    if host in {"vk.com", "m.vk.com", "vkvideo.ru"}:
        return "vk"
    raise VideoLinkError("Only YouTube, Rutube, VK links allowed")


def normalize_video_url(url: str) -> str:
    return url.strip()


def video_embed_url(platform: str, url: str) -> str | None:
    if platform == "youtube":
        match = re.search(r"(?:v=|youtu\.be/|embed/)([\w-]{11})", url)
        if match:
            return f"https://www.youtube.com/embed/{match.group(1)}"
    if platform == "rutube":
        match = re.search(r"rutube\.ru/video/([a-f0-9-]+)", url)
        if match:
            return f"https://rutube.ru/play/embed/{match.group(1)}"
    if platform == "vk":
        match = re.search(r"vk\.com/video(-?\d+_\d+)", url)
        if match:
            oid, vid = match.group(1).split("_", 1)
            return f"https://vk.com/video_ext.php?oid={oid}&id={vid}"
    return None
