local utils = require "utils"

local status, data = pcall(utils.loadConfig)

if status then
    config = data
else
    config = {}
    print(data)
end

print(config.id)
print('Starting...')

sda, scl = 1, 2
i2c.setup(0, sda, scl, i2c.SLOW)

tmr.create():alarm(5000, tmr.ALARM_SINGLE, function()
    print(wifi.sta.getip())
    am2320.setup()
    print('Starting server...')
    dofile('server.lua')
end)
