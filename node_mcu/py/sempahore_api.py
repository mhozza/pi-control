from requests import HTMLResponse
import led_control

s = led_control.semaphore


def semaphore(request):
    global s
    if request.query["c"] == "off":
        s.deinit()
        return HTMLResponse()

    if request.query["c"] == "red":
        s.set_red()
    if request.query["c"] == "green":
        s.set_green()

    return HTMLResponse()
