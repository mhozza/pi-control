from server import Server
from urlconfig import URL_CONFIG
import network
import led_control
import button

sta_if = network.WLAN(network.STA_IF)
print(sta_if.ifconfig())
print("Urlconfig:", URL_CONFIG.keys())

led_control.reset_pins()


def toggle_semaphore(_):
    led_control.semaphore.toggle()


button.add_button_listener(4, toggle_semaphore)


server = Server(urlconfig=URL_CONFIG, debug=2)
server.start()
