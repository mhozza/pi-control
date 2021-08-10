from server import Server
from urlconfig import URL_CONFIG
import network
import led_control

sta_if = network.WLAN(network.STA_IF)

led_control.reset_pins()

print(sta_if.ifconfig())
print("Urlconfig:", URL_CONFIG.keys())

server = Server(urlconfig=URL_CONFIG, debug=2)
server.start()
