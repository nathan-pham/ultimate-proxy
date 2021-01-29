const script = document.getElementById("injection-script")
const url = new URL(script.dataset.url)
const { prefix } = script.dataset

const rewrite = (inputUrl) => {
  let proxy = inputUrl

  if(inputUrl.startsWith(window.location.origin + "/") && !inputUrl.startsWith(window.location.origin + prefix)) {
    proxy = '/' + inputUrl.split('/').splice(3).join('/')
  }

  if(inputUrl.startsWith("//")) {
    proxy = "http:" + inputUrl
  }
  else if(inputUrl.startsWith('/') && !inputUrl.startsWith(prefix)) {
    proxy = url.origin + inputUrl
  }
  
  if(inputUrl.startsWith("http")) {
    let _url = new URL(inputUrl)
    proxy = prefix + _url.origin + _url.path
  }

  return proxy
}

const rFetch = window.fetch
window.fetch = (_url, options) => {
  _url = rewrite(_url)
  return rFetch(rewrite(_url), options)
}

const rXML = window.XMLHttpRequest.prototype.open
window.XMLHttpRequest.prototype.open = (method, _url, ...args) => {
  return rXML(method, rewrite(_url), ...args)
}

const rElement = document.createElement
document.createElement = (_tag) => {
  let element = rElement.call(document, _tag)
  let tag = _tag.toLowerCase()
  if(["script", "iframe", "embed", "img"].includes(tag)) {
    Object.defineProperty(element._proto_, "src", {
      set: (value) => element.setAttribute("src", rewrite(value))
    })
  }
  else if(["link", "a"].includes(tag)) {
    Object.defineProperty(element._proto_, "href", {
      set: (value) => element.setAttribute("href", rewrite(value))
    })
  }
  else if(tag == "form") {
    Object.defineProperty(element._proto_, "action", {
      set: (value) => element.setAttribute("action", rewrite(value))
    })
  }

  return element
}

const rAttribute = window.Element.prototype.setAttribute
window.Element.prototype.setAttribute = (attribute, value) => {
  if(["src", "href", "action"].includes(attribute)) {
    value = rewrite(value)
  }

  return rAttribute(attribute, value)
}

history.pushState = new Proxy(history.pushState, {
  apply: (target, _this, args) => {
    args[2] = rewrite(args[2])
    return target.apply(_this, args)
  }
})

let previousState = window.history.state
setInterval(() => {
  if(!location.pathname.startsWith(`${prefix}${url.hostname}`)) {
    history.replaceState('', '', `${prefix}${url.href.replace(/^(https?:|)\/\//, "")}`)
  }
}, 0.1)

/*
var previousState = window.history.state;
setInterval(function() {

       if (!window.location.pathname.startsWith(`${prefix}${btoa(url.origin)}/`)) {

        history.replaceState('', '', `${prefix}${btoa(url.origin)}/${window.location.href.split('/').splice(3).join('/')}`);
    }
}, 0.1);
 */