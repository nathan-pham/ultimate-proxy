class Proxy {
  constructor(config={}) {
    this.config = {
      prefix: "/fetch/",
      response: {},
      request: {}
    }

    for(const [key, value] of Object.entries(config)) {
      if(this.config[key]) {
        this.config[key] = value
      }
    }
  }
  app() {
    return require("./main")(this.config)
  }
  ws(server) {
    return require("./websocket")(server, this.config)
  }
}

module.exports = Proxy