const mime = require("mime-types")
const fetch = require("node-fetch")
const rewrite = require("./rewrite")
const { btoa, atob, startsWith } = require("./utils")

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
        mode: "no-cors"
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

    for(const header of ["host", "accept-encoding", "referer", "via"]) {
      delete proxy.request.headers[header]
    }

    let body = ""

    try {
      proxy.response = await fetch(proxy.url.href, proxy.request).catch(e => {
        return {
          headers: {},
          status: 404
        }  
      })
      body = await proxy.response.buffer()
    }
    catch(e) {}

    if(!proxy.response.headers["content-type"]) {
      const setType = (t) => {
        proxy.response.headers["content-type"] = t
      }

      let ending = String(proxy.url.pathname).split('.').pop()
      let m = mime.lookup(ending)

      if(m) {
        setType(mime.contentType(m))
      }
      else if(ending.endsWith("css")) {
        setType("text/css")
      }
      else if(ending == "map") {
        setType("application/javascript")
      }
      else {
        setType("text/html")
      }
    }

    

    rewrite.headers(proxy)
    res.writeHead(proxy.response.status, proxy.response.headers)
    

    if(startsWith(["text/html", "text/css"], proxy.response.headers["content-type"])) {
      return res.end(rewrite.body(body.toString(), proxy))
    }

    return res.end(body)
  }
}
