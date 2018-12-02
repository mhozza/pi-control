local utils = require "utils"

config = utils.loadConfig()

local function receiver(conn, payload)
    print(payload)
    response = utils.createPayload(config)
    jsonResponse = sjson.encode(response)
    print(config, response, jsonResponse)
    conn:send(jsonResponse)
end

srv = net.createServer(net.TCP)
srv:listen(80, function(conn0)
    conn0:on("receive", receiver)
end)


