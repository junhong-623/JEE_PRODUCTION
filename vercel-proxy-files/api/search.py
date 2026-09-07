from http.server import BaseHTTPRequestHandler
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.error
import re
import json


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

        # CORS headers (allows GitHub Pages calls)
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        if len(num) != 4:
            self._write({"error": "请输入完整的 4 位号码"})
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

        except urllib.error.URLError as e:
            self._write({"error": f"抓取失败: {e.reason}"})
            return
        except Exception as e:
            self._write({"error": f"未知错误: {str(e)}"})
            return

        cn, en, image = parse_dreambook(html)
        if not image:
            self._write({"error": "未找到对应的千字图"})
            return

        self._write({"num": num, "cn": cn, "en": en, "image": image})

    def _write(self, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # Silent logging
