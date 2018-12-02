print('Hello ;)')

sda, scl = 1, 2
i2c.setup(0, sda, scl, i2c.SLOW)

tmr.create():alarm(5000, tmr.ALARM_SINGLE, function()
    print(wifi.sta.getip())
    am2320.setup()
    dofile('server.lua')
end)
