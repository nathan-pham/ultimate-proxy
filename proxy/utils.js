const btoa = str => new Buffer.from(str).toString("base64")
const atob = str => new Buffer.from(str).toString("utf-8")

const types = { '.html': 'text/html', '.js':   'text/javascript', '.css':  'text/css', '.json': 'application/json', '.png':  'image/png', '.jpg':  'image/jpg', '.gif':  'image/gif', '.svg':  'image/svg+xml', '.wav':  'audio/wav', '.mp4':  'video/mp4', '.woff': 'application/font-woff', '.ttf':  'application/font-ttf', '.eot':  'application/vnd.ms-fontobject', '.otf':  'application/font-otf', '.wasm': 'application/wasm' }

module.exports = {
  btoa, 
  atob,
  types
}