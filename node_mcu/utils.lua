function createPayload()
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
    if file.open("config.json") then
        raw_config = file.read()
        file.close()
        return sjson.decode(raw_config)
    end
    return {}
end

return {
    createPayload = createPayload,
    loadConfig = loadConfig
}
