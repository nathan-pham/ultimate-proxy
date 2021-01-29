const btoa = str => new Buffer.from(str).toString("base64")
const atob = str => new Buffer.from(str).toString("utf-8")

const startsWith = (possible, matches) => { 
  for(const p of possible) { 
    if(matches.startsWith(p)) { 
      return true 
    } 
  } 
  return false 
}

module.exports = {
  btoa, 
  atob,
  startsWith
}