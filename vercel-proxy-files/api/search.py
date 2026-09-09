from http.server import BaseHTTPRequestHandler
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs
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


class MeaningParser(HTMLParser):
    """Extract operator-specific meanings from a Fast4DKing result table."""

    def __init__(self, number):
        super().__init__(convert_charrefs=True)
        self.number = number
        self.meanings = []
        self._in_row = False
        self._cell = None
        self._cells = []
        self._operator = ""

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "tr":
            self._in_row = True
            self._cell = None
            self._cells = []
            self._operator = ""
        elif self._in_row and tag == "td":
            self._cells.append([])
            self._cell = self._cells[-1]
        elif self._in_row and tag == "br" and self._cell is not None:
            self._cell.append("\n")
        elif self._in_row and tag == "img" and not self._operator:
            self._operator = attributes.get("alt", "").strip()

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag):
        if tag == "td":
            self._cell = None
        elif tag == "tr" and self._in_row:
            self._store_row()
            self._in_row = False

    def _store_row(self):
        if len(self._cells) != 3:
            return
        number = re.sub(r"\D", "", "".join(self._cells[0]))
        operator = self._operator.lower()
        labels = {
            "magnum": "Magnum",
            "damacai": "Da Ma Cai",
            "sports toto": "Sports Toto",
        }
        label = next((value for key, value in labels.items() if key in operator), "")
        if number != self.number or not label:
            return
        parts = [re.sub(r"\s+", " ", part).strip() for part in "".join(self._cells[2]).split("\n")]
        parts = [part for part in parts if part]
        if not parts:
            return
        self.meanings.append({
            "operator": label,
            "en": parts[0],
            "cn": parts[1] if len(parts) > 1 else "",
        })


def parse_meanings(page, number):
    parser = MeaningParser(number)
    parser.feed(page)
    return parser.meanings


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Preserve the exact 1-4 digit query. 001 and 0001 are different entries.
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        num_raw = params.get("num", [""])[0]
        num = re.sub(r"\D", "", num_raw)

        if num != num_raw or not 1 <= len(num) <= 4:
            self._write({"error": "请输入 1–4 位号码"}, status=400)
            return

        url = f"https://mobile.fast4dking.com/v2/searchnumber.php?n={num}"

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

        meanings = parse_meanings(html, num)
        if not meanings:
            self._write({"error": "未找到对应的千字图"}, status=404)
            return

        primary = next((item for item in meanings if item["operator"] == "Sports Toto"), meanings[0])
        self._write(
            {"num": num, "cn": primary["cn"], "en": primary["en"], "image": "", "meanings": meanings},
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
