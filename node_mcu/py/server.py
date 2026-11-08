import socket

try:
    from requests import parse_request, Response, HTMLErrorResponse
except (ImportError, AttributeError):
    try:
        from .requests import parse_request, Response, HTMLErrorResponse
    except (ImportError, ValueError):
        import importlib.util
        import os

        _req_path = os.path.join(os.path.dirname(__file__), "requests.py")
        _spec = importlib.util.spec_from_file_location("node_mcu_requests", _req_path)
        _mod = importlib.util.module_from_spec(_spec)
        _spec.loader.exec_module(_mod)
        parse_request = _mod.parse_request
        Response = _mod.Response
        HTMLErrorResponse = _mod.HTMLErrorResponse


class Server:
    def __init__(self, urlconfig, port=80, debug=0, timeout=10):
        self.running = False
        self.addr = socket.getaddrinfo("0.0.0.0", port)[0][-1]
        self.urlconfig = urlconfig
        self.debug = debug
        self.timeout = timeout

    def start(self):
        self.running = True

        s = socket.socket()
        s.bind(self.addr)
        s.listen(1)

        print("Web server running. Listening on", self.addr)

        try:
            while self.running:
                conn, addr = s.accept()
                print("client connected from", addr)
                self._serve(conn)
        finally:
            self.running = False
            s.close()

    def stop(self):
        self.running = False

    def _handle(self, request):
        if request.path in self.urlconfig:
            return self.urlconfig[request.path](request)
        else:
            return Response(code=404)

    def _serve(self, conn):
        try:
            conn.settimeout(self.timeout)
            cl_file = conn.makefile("rwb", 0)
            raw_request = []
            line_limit_exceeded = False
            while len(raw_request) < 20:
                line = cl_file.readline(512)
                if not line or line == b"\r\n":
                    break
                if len(line) >= 512:
                    line_limit_exceeded = True
                    break
                raw_request.append(line)

            if line_limit_exceeded:
                response = HTMLErrorResponse(code=414, message="URI Too Long", description="Line length exceeded")
                response.send(conn)
                return

            if not raw_request:
                return

            try:
                request = parse_request(raw_request, self.debug)
                response = self._handle(request)
            except Exception as e:
                if self.debug > 0:
                    response = HTMLErrorResponse(message=str(type(e)), description=e)
                else:
                    response = HTMLErrorResponse(
                        code=500,
                        message="Internal Server Error",
                        description="An unexpected error occurred.",
                    )
            response.send(conn)
        except Exception as e:
            print(e)
        finally:
            conn.close()
