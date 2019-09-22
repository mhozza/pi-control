#!/usr/bin/env python
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import logging
import os


def env(name, default=None, type=str):
    return type(os.environ.get(name, default))


LOG_LEVELS = {
    "CRITICAL": logging.CRITICAL,
    "ERROR": logging.ERROR,
    "WARNING": logging.WARNING,
    "INFO": logging.INFO,
    "DEBUG": logging.DEBUG,
    "NOTSET": logging.NOTSET,
}


def wakeonlan(mac):
    if mac is not None:
        logging.info("Waking up {}.".format(mac))
        return os.system("wakeonlan {}".format(mac))
    else:
        logging.warn("No mac address specified.")


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url = urlparse(self.path)
            params = parse_qs(url.query)
            self.send_response(204)
            logging.debug(params)
            wakeonlan(params.get("mac", [None])[0])
        except Exception as e:
            logging.exception(e)


class Server:
    def __init__(self):
        server_address = ("0.0.0.0", env("PORT", 8100, int))
        logging.info("Setting up server... %s", server_address)
        self.server = HTTPServer(server_address, RequestHandler)

    def start(self):
        logging.info("running server...")
        self.server.serve_forever()
        logging.info("finished.")

    def stop(self):
        self.server.shutdown()
        logging.debug("shuting down server")


if __name__ == "__main__":
    logging.basicConfig(level=LOG_LEVELS.get(env("LOG_LEVEL"), logging.WARNING))
    server = Server()
    server.start()
