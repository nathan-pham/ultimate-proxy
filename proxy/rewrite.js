const { startsWith } = require("./utils")
const { JSDOM } = require("jsdom")
const path = require("path")

const validate = (str) => {
  let url = ""

  try {
    url = new URL(str)
  }
  catch(e) {
    return false
  }

  return ["http:", "https:"].includes(url.protocol)
}

const resolveLink = (resource, domain) => {
  let url = new URL("https://" + domain)
  let { pathname, host } = url

  if(resource.substring(0, 2) == "//") {
    resource = resource.substring(2)
  }
  else if(resource.substring(0, 1) == '/') {
    resource = `${host}${resource}`
  }
  else if(resource.substring(0, 2) == "./") {
    resource = `${host}${path.resolve(pathname, resource)}`
  }
  else if(resource.substring(0, 3) == "../" || !resource.startsWith("http")) {
    resource = `${host}/${resource}`
  }

  return resource.replace(/^(https?:|)\/\//, "")
}

const body = (text, proxy) => {
  const { prefix, url, injection } = proxy
  let proxied_body = text
    .replace(/integrity="(.*?)"/gi, '')
		.replace(/nonce="(.*?)"/gi, '')
    .replace(/(window|document).location.href/gi, `"${ url.href }"`)
		.replace(/(window|document).location.hostname/gi, `"${ url.hostname }"`)
		.replace(/(window|document).location.pathname/gi, `"${ url.path }"`)
    // .replace(new RegExp(url.href, "gi"), ``)
		.replace(/location.href/gi, `"${ url.href }"`)
		.replace(/location.hostname/gi, `"${ url.hostname }"`)
		.replace(/location.pathname/gi, `"${ url.path }"`)
    .replace(/url\("\/\/(.*?)"\)/gi, `url("http://` + `$1` + `")`)
		.replace(/url\('\/\/(.*?)'\)/gi, `url('http://` + `$1` + `')`)
		.replace(/url\(\/\/(.*?)\)/gi, `url(http://` + `$1` + `)`)
		.replace(/url\("\/(.*?)"\)/gi, `url("${ prefix }${ url.origin }/` + `$1` + `")`)
		.replace(/url\('\/(.*?)'\)/gi, `url('${ prefix }${ url.origin }/` + `$1` + `')`)
		.replace(/url\(\/(.*?)\)/gi, `url(${ prefix }${ url.origin }/` + `$1` + `)`)

  if(!startsWith(["text/html"], proxy.response.headers["content-type"])) {
    return proxied_body
  }

  let jsdom = new JSDOM(proxied_body)
  let { window } = jsdom
  let attributes = "href|src|poster|data|action|srcset|data-src|data-href".split('|')
  let elements = window.document.querySelectorAll(attributes.map(v => `[${ v }]`).join(","))
  
  for(const element of elements) {
    for(const attribute of attributes) {
      if(element.hasAttribute(attribute)) {
        let original = element.getAttribute(attribute)
        let resolved = original.startsWith("data:") ? original : prefix + resolveLink(original, url.hostname)

        element.setAttribute(attribute, resolved)
        // element.setAttribute(attribute, resolveLink(original, url.hostname))

        // url.hostname
        // if(validate(original)) {
        //   element.setAttribute(attribute, path.join(prefix, original))
        // }
        // else {
        //   element.setAttribute(attribute, path.join(prefix, url.origin, original))
        // }
      }
    }
  }

  if(injection) {
    window.document.head.innerHTML = `<script src="/js/inject.js" data-prefix="${ prefix }" data-url="${ url.href.replace(prefix, "") }" id="injection-script" type="module"></script>` +  window.document.head.innerHTML
  }

  return jsdom.serialize()
}

const headers = (proxy) => {
  const includesArray = (match, array) => {
    for(const item of array) {
      if(match.includes(item) || match == item) {
        return true
      }
    }

    return false
  }
  
  for(const [key, value] of Object.entries(proxy.response.headers)) {
    const headerName = key.toLowerCase()
    const headerValue = value.toLowerCase()

    if(headerName == "location") {
      proxy.response.status = 308
      proxy.response.headers[headerName] = proxy.prefix + headerValue
    }
    else if(headerName == "set-cookie") {
      for(let cookie of headerValue) {
        cookie = cookie.replace(/Domain=(.*?);/gi, `Domain=` + proxy.req.headers['host'] + ';').replace(/(.*?)=(.*?);/, '$1' + '@' + proxy.url.hostname + `=` + '$2' + ';')
      }
    }
    else if(includesArray(headerName, [ "content-encoding", "x-", "cf-", "strict-transport-security", "content-security-policy", "content-length" ])) {
      delete proxy.response.headers[headerName]
    }
  }
}

module.exports = {
  body, 
  headers
}