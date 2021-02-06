import machine
from requests import HTMLResponse

pins = [machine.Pin(i, machine.Pin.IN) for i in (0, 12, 13, 14, 15)]


def pin_status(request):
    head = " <title>ESP8266 Pins</title>"
    body = """
    <h1>ESP8266 Pins</h1>
    <table border="1"> <tr><th>Pin</th><th>Value</th></tr> %s </table>
    """
    rows = ["<tr><td>%s</td><td>%d</td></tr>" % (str(p), p.value()) for p in pins]
    body = body % "\n".join(rows)
    return HTMLResponse(head=head, body=body)
