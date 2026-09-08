from http.server import BaseHTTPRequestHandler
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, parse_qs
import urllib.request
import urllib.error
import re
import json


ALLOWED_ORIGINS = {
    "https://www.jeeprod.com",
    "https://jeeprod.com",
    "https://jee-production.web.app",
    "https://jee-production.firebaseapp.com",
    "https://jeeprod.web.app",
    "https://jeeprod.firebaseapp.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}


class DreambookParser(HTMLParser):
    """Extract the first dreambook card from a 4D2U Live search page."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cn = ""
        self.en = ""
        self.image = ""
        self._capture = None
        self._buffer = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set(attributes.get("class", "").split())

        if tag == "img" and "img-dreambook" in classes and not self.image:
            self.image = attributes.get("src", "").strip()
        elif tag == "h5" and "card-title" in classes and not self.cn:
            self._capture = "cn"
            self._buffer = []
        elif tag == "p" and "card-text" in classes and not self.en:
            self._capture = "en"
            self._buffer = []

    def handle_data(self, data):
        if self._capture:
            self._buffer.append(data)

    def handle_endtag(self, tag):
        expected_tag = "h5" if self._capture == "cn" else "p"
        if self._capture and tag == expected_tag:
            value = re.sub(r"\s+", " ", "".join(self._buffer)).strip()
            setattr(self, self._capture, value)
            self._capture = None
            self._buffer = []


def parse_dreambook(page):
    parser = DreambookParser()
    parser.feed(page)
    return parser.cn, parser.en, parser.image


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Parse ?num=1234 parameter
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        num_raw = params.get("num", [""])[0]
        num = re.sub(r"\D", "", num_raw)

        if len(num) != 4:
            self._write({"error": "请输入完整的 4 位号码"}, status=400)
            return

        url = f"https://4d2ulive.com/search/{num}"

        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 Chrome/140.0 Safari/537.36"
                    ),
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode("utf-8", errors="ignore")

        except urllib.error.HTTPError as error:
            status = 404 if error.code == 404 else 502
            message = "未找到对应的千字图" if status == 404 else "资料来源暂时无法连接，请稍后再试"
            self._write({"error": message}, status=status)
            return
        except (urllib.error.URLError, TimeoutError):
            self._write({"error": "资料来源暂时无法连接，请稍后再试"}, status=502)
            return
        except Exception:
            self._write({"error": "查询服务暂时不可用，请稍后再试"}, status=500)
            return

        cn, en, image = parse_dreambook(html)
        if not image:
            self._write({"error": "未找到对应的千字图"}, status=404)
            return

        self._write(
            {"num": num, "cn": cn, "en": en, "image": urljoin(url, image)},
            cache="public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        )

    def _write(self, data: dict, status=200, cache="no-store"):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        origin = self.headers.get("Origin", "")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", cache)
        self.send_header("Vary", "Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # Silent logging
