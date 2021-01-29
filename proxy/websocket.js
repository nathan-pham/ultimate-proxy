const WebSocket = require("ws")
// const { btoa, atob } = require("./utils")

module.exports = (server, config) => {
  const wss = new WebSocket.Server({ server })
  
  wss.on("connection", (con, req) => {
    try {
      const socket = new WebSocket(req.url.replace(config.prefix + "ws/", ''))

      socket.on("message", data => con.send(data))

      socket.on("open", () => {
        con.on("message", data => socket.send(data))
      })

      con.on("close", code => socket.close(code || 1006))
      
      socket.on("close", code => con.close(code || 1006))
    }
    catch(e) {
      con.close(1001)
    }
  })
}