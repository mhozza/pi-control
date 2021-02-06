import ujson


def parse_request(raw_request, debug=0):
    if debug >= 2:
        print(raw_request)

    method, path, protocol = raw_request[0].decode().split()
    query = dict()
    if "?" in path:
        path, qstring = path.split("?", 1)
        query = {
            q[0]: q[1] if len(q) > 1 else ""
            for q in map(lambda s: s.split("&"), qstring)
            if q and len(q) >= 1
        }

    headers = {
        h[0]: h[1].strip()
        for h in map(lambda line: line.decode().split(":", 1), raw_request)
        if h and len(h) == 2
    }

    if debug >= 1:
        print(method, path, protocol)
        print(query)
        print(headers)

    return Request(method=method, path=path, query=query, headers=headers)


class Request:
    def __init__(self, method, path, query, headers):
        self.method = method
        self.path = path
        self.query = query
        self.headers = headers

    def __str__(self):
        return "Request({method}, {path}, {query})".format(
            method=self.mehtod, path=self.path, query=self.query
        )


class Response:
    def __init__(self, body="", code=200, content_type="text/html"):
        self.body = body
        self.code = code
        self.type = content_type

    def __str__(self):
        return "Response({code}, {type})".format(code=self.code, type=self.type)

    @property
    def status_line(self):
        return "HTTP/1.0 {code} OK\r\nContent-type: {type}\r\n\r\n".format(
            code=self.code, type=self.type
        )

    def send(self, conn):
        conn.send(self.status_line)
        conn.send(self.body)


class HTMLResponse(Response):
    html = """<!DOCTYPE html>
    <html>
        <head>
        {head}
        </head>
        <body>
        {body}
        </body>
    </html>
    """

    def __init__(self, body="", head="", **kwargs):
        super().__init__(body=self.html.format(head=head, body=body), **kwargs)


class HTMLErrorResponse(HTMLResponse):
    head = "<title>{message}</title>"
    body = "<h1>{message}</h1>{description}"

    def __init__(self, code=500, message="", description="", traceback=None, **kwargs):
        body = self.body.format(message=message, description=description)
        if traceback:
            body = "{main}<br/><pre>{traceback}</pre>".format(main=body, traceback=traceback)
        super().__init__(body=body, head=self.head.format(message=message), **kwargs)


class JsonResponse(Response):
    def __init__(self, data, **kwargs):
        body = ujson.dumps(data)
        super().__init__(body=body, content_type="application/json", **kwargs)
