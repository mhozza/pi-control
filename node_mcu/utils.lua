function createPayload(config)
    ip, mask, gateway = wifi.sta.getip()
    h, t = am2320.read()

    payload = {}
    payload.id = config.id
    payload.temperature = t
    payload.humidity = h
    payload.ip = ip
    return payload
end

function loadConfig()
    return {
        id = 'bedroom'
    }
end

return {
    createPayload = createPayload,
    loadConfig = loadConfig
}
