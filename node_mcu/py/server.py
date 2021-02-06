import socket
from requests import parse_request, Response, HTMLErrorResponse


class Server:
    def __init__(self, urlconfig, port=80, debug=0):
        self.running = False
        self.addr = socket.getaddrinfo("0.0.0.0", port)[0][-1]
        self.urlconfig = urlconfig
        self.debug = debug

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
            cl_file = conn.makefile("rwb", 0)
            raw_request = []
            while True:
                line = cl_file.readline()
                if not line or line == b"\r\n":
                    break
                raw_request.append(line)
            try:
                request = parse_request(raw_request, self.debug)
                response = self._handle(request)
            except Exception as e:
                response = HTMLErrorResponse(message=str(type(e)), description=e)
            response.send(conn)
        except Exception as e:
            print(e)
        finally:
            conn.close()
