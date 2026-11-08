import importlib.util
import io
from pathlib import Path
from unittest import TestCase
from unittest.mock import MagicMock

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MCU_PY_DIR = REPO_ROOT / "node_mcu" / "py"

# Dynamically load MCU modules to avoid polluting sys.modules['requests']
req_spec = importlib.util.spec_from_file_location("node_mcu_requests", MCU_PY_DIR / "requests.py")
mcu_requests = importlib.util.module_from_spec(req_spec)
req_spec.loader.exec_module(mcu_requests)

srv_spec = importlib.util.spec_from_file_location("node_mcu_server", MCU_PY_DIR / "server.py")
mcu_server = importlib.util.module_from_spec(srv_spec)
srv_spec.loader.exec_module(mcu_server)


class NodeMcuRequestsTestCase(TestCase):
    def test_parse_valid_request(self):
        raw = [
            b"GET /status?fan=1&speed=high HTTP/1.1\r\n",
            b"Host: 192.168.1.50\r\n",
            b"Accept: application/json\r\n",
        ]
        req = mcu_requests.parse_request(raw)
        self.assertEqual(req.method, "GET")
        self.assertEqual(req.path, "/status")
        self.assertEqual(req.query, {"fan": "1", "speed": "high"})
        self.assertEqual(req.headers["Host"], "192.168.1.50")
        self.assertEqual(req.headers["Accept"], "application/json")

    def test_parse_request_with_default_protocol(self):
        raw = [b"GET /home\r\n"]
        req = mcu_requests.parse_request(raw)
        self.assertEqual(req.method, "GET")
        self.assertEqual(req.path, "/home")

    def test_parse_empty_request_raises_value_error(self):
        with self.assertRaises(ValueError) as ctx:
            mcu_requests.parse_request([])
        self.assertIn("Empty request", str(ctx.exception))

    def test_parse_malformed_request_raises_value_error(self):
        with self.assertRaises(ValueError) as ctx:
            mcu_requests.parse_request([b"INVALID\r\n"])
        self.assertIn("Malformed request line", str(ctx.exception))

    def test_request_str_representation_typo_fixed(self):
        req = mcu_requests.Request(method="POST", path="/api", query={"k": "v"}, headers={})
        str_rep = str(req)
        self.assertIn("Request(POST, /api, {'k': 'v'})", str_rep)


class NodeMcuServerTestCase(TestCase):
    def setUp(self):
        self.server_debug_0 = mcu_server.Server(urlconfig={}, debug=0)
        self.server_debug_1 = mcu_server.Server(urlconfig={}, debug=1)

    def test_serve_sets_socket_timeout(self):
        conn = MagicMock()
        conn.makefile.return_value = io.BytesIO(b"GET / HTTP/1.0\r\n\r\n")
        self.server_debug_0._serve(conn)
        conn.settimeout.assert_called_once_with(10)

    def test_serve_rejects_oversized_line_with_414(self):
        conn = MagicMock()
        sent = []
        conn.send.side_effect = lambda data: sent.append(data)
        # 520 byte request line exceeding 512 byte limit
        oversized_line = b"GET /" + (b"A" * 520) + b" HTTP/1.0\r\n"
        conn.makefile.return_value = io.BytesIO(oversized_line)

        self.server_debug_0._serve(conn)
        combined_sent = "".join(s if isinstance(s, str) else s.decode(errors="ignore") for s in sent)
        self.assertIn("414", combined_sent)
        self.assertIn("URI Too Long", combined_sent)

    def test_serve_line_count_limit_stops_reading(self):
        conn = MagicMock()
        # 25 lines of headers
        lines = [b"GET / HTTP/1.0\r\n"] + [f"Header-{i}: val\r\n".encode() for i in range(25)]
        conn.makefile.return_value = io.BytesIO(b"".join(lines))

        self.server_debug_0._serve(conn)
        conn.close.assert_called_once()

    def test_serve_returns_generic_500_when_debug_is_0(self):
        conn = MagicMock()
        sent = []
        conn.send.side_effect = lambda data: sent.append(data)

        # Faulty handler that throws an internal error
        def faulty_handler(request):
            raise RuntimeError("Database connection string contains private_secret_pwd")

        srv = mcu_server.Server(urlconfig={"/error": faulty_handler}, debug=0)
        conn.makefile.return_value = io.BytesIO(b"GET /error HTTP/1.0\r\n\r\n")
        srv._serve(conn)

        combined_sent = "".join(s if isinstance(s, str) else s.decode(errors="ignore") for s in sent)
        self.assertIn("Internal Server Error", combined_sent)
        self.assertNotIn("private_secret_pwd", combined_sent)

    def test_serve_returns_detailed_error_when_debug_is_enabled(self):
        conn = MagicMock()
        sent = []
        conn.send.side_effect = lambda data: sent.append(data)

        def faulty_handler(request):
            raise RuntimeError("Debug detail error message")

        srv = mcu_server.Server(urlconfig={"/error": faulty_handler}, debug=1)
        conn.makefile.return_value = io.BytesIO(b"GET /error HTTP/1.0\r\n\r\n")
        srv._serve(conn)

        combined_sent = "".join(s if isinstance(s, str) else s.decode(errors="ignore") for s in sent)
        self.assertIn("Debug detail error message", combined_sent)


class NodeMcuBootAndMainSecurityTestCase(TestCase):
    def test_main_debug_defaults_to_zero(self):
        content = (MCU_PY_DIR / "main.py").read_text()
        self.assertIn("debug=0", content)
        self.assertNotIn("debug=2", content)

    def test_boot_does_not_unconditionally_start_webrepl(self):
        content = (MCU_PY_DIR / "boot.py").read_text()
        active_lines = [
            line.strip()
            for line in content.splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
        self.assertNotIn("webrepl.start()", active_lines)
