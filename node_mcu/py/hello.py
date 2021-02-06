from requests import HTMLResponse
from config import CONFIG
import network

sta_if = network.WLAN(network.STA_IF)


def hello(request):
    head = "<title>{id} - ESP8266</title>".format(id=CONFIG["id"])
    body = """
    <h1>{id} - ESP8266</h1>
    <table border="1">{rows}</table>
    """
    data = {"network": sta_if.ifconfig()}
    rows = ["<tr><td>{}</td><td>{}</td></tr>".format(k, v) for k, v in data.items()]
    body = body.format(id=CONFIG["id"], rows="\n".join(rows))
    return HTMLResponse(head=head, body=body)
