from requests import HTMLResponse
from led_control import Semaphore

s = None


def semaphore(request):
    global s

    def get_semaphore():
        global s
        if s is None:
            s = Semaphore(500)
        return s

    if request.query["c"] == "off":
        if s is not None:
            s.deinit()
            s = None
        return HTMLResponse()

    if request.query["c"] == "red":
        get_semaphore().set_red()
    if request.query["c"] == "green":
        get_semaphore().set_green()

    return HTMLResponse()
