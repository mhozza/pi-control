from server import Server
from urlconfig import URL_CONFIG
import network

sta_if = network.WLAN(network.STA_IF)

print(sta_if.ifconfig())
print("Urlconfig:", URL_CONFIG.keys())

server = Server(urlconfig=URL_CONFIG, debug=2)
server.start()
