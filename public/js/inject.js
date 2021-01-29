(() => {
  const script = document.getElementById("injection-script")
  const url = new URL(script.dataset.url)
  const { prefix } = script.dataset

  const rewrite = (inputUrl) => {
    let proxy = inputUrl

    if(inputUrl.startsWith(window.location.origin + "/") && !inputUrl.startsWith(window.location.origin + prefix)) {
      proxy = '/' + inputUrl.split('/').splice(3).join('/')
    }

    if(inputUrl.startsWith("//")) {
      proxy = "https:" + inputUrl
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
  window.fetch = function(_url, options) {
    _url = rewrite(_url)
    return rFetch.apply(this, arguments)
  }

  const rXML = window.XMLHttpRequest.prototype.open
  window.XMLHttpRequest.prototype.open = function(method, _url, _async, user, password) {
    _url = rewrite(_url)
    return rXML.apply(this, arguments)
  }

  const rElement = document.createElement
  document.createElement = function(_tag) {
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
  window.Element.prototype.setAttribute = function(key, value) {
    if(["src", "href", "action"].includes(key)) {
      value = rewrite(value)
    }
    return rAttribute.apply(this, arguments)
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
})()