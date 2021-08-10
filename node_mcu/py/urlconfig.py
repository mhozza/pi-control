from temperature import get_temperature
from hello import hello
from sempahore_api import semaphore

URL_CONFIG = {
    "/temperature": get_temperature,
    "/": hello,
    "/semaphore": semaphore,
}
