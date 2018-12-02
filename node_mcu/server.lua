local utils = require "utils"

local function receiver(conn, payload)
    print(payload)
    response = utils.createPayload()
    jsonResponse = sjson.encode(response)
    print(jsonResponse)
    conn:send(jsonResponse)
end

srv = net.createServer(net.TCP)
srv:listen(80, function(conn0)
    conn0:on("receive", receiver)
end)

print('Server started. Listening...')


