const fetch = require("node-fetch")
const rewrite = require("./rewrite")
const { types } = require("./utils")

module.exports = (config) => {
  return async (req, res, next) => {
    if(!config.injection) {
      config.injection = true
    }

    if(!(req.url.startsWith(config.prefix) && config.injection)) {
      return next()
    }

    let proxy = {
      request: {
        headers: {},
        method: req.method,
        rejectUnauthorized: false,
      },
      prefix: config.prefix,
      injection: config.injection,
      req, res, next
    }

    try {
      proxy.url = new URL("https://" + req.url
        .replace(/^(https?:|)\/\//, "")
        .replace(config.prefix, "")
      )
    }
    catch(e) {}

    Object.assign(proxy.request.headers, req.headers || {})
    delete proxy.request.headers["host"]

    // let origin = proxy.request.headers["origin"]
    // if(origin) {
    //   proxy.request.headers["origin"] = rewrite.origin(origin, proxy)
    // }

    let cookie = proxy.request.headers["cookie"]
    if(cookie) {
      let newCookies = []
      for(const [ cookieName, cookieValue ] of cookie.split("; ").map(v => v.split(/=(.+)/))) {
        let testCookie = cookieName.split('@').splice(0, 1).join()
        if(proxy.url.hostname.includes(testCookie)) {
          newCookies.push(testCookie + "=" + cookieValue)
        }
      }
      proxy.request.headers["cookie"] = newCookies.join("; ")
    }

		delete proxy.request.headers["accept-encoding"]

    // const Location = `${ config.prefix }${ proxy.url.origin }/`
    // if(!req.url.startsWith(Location)) {
    //   res.writeHead(307, {
    //     Location
    //   })
    //   return res.end()
    // }

    let body = ""

    try {
      proxy.response = await fetch(proxy.url.href, proxy.request).catch(e => {
        return {
          headers: {},
          status: 404
        }  
      })
      body = await proxy.response.text()
    }
    catch(e) {}

    if(!proxy.response.headers["content-type"]) {
      proxy.response.headers["content-type"] = "text/html"
      
      for(const [ type, encoding ] of Object.entries(types)) {
        if(proxy.url.href.endsWith(type)) {
          proxy.response.headers["content-type"] = encoding
        }
      }
    }
    
    rewrite.headers(proxy)
    res.writeHead(proxy.response.status, proxy.response.headers)

    if(["text/html", "text/css"].includes(proxy.response.headers["content-type"])) {
      return res.end(rewrite.body(body, proxy))
    }

    return res.end(body)
  }
}
