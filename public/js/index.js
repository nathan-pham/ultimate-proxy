const $ = (q) => document.querySelector(q)
const app = $("#app")
const input = $("input")
const button = $("button")

const submit = () => {
  app.innerHTML = 
  `
  <iframe src="${window.location}/fetch/${input.value}" sandbox="allow-scripts allow-forms allow-same-origin"></iframe> 
  `
}

input.addEventListener("keydown", e => {
  if(e.key == "Enter") {
    submit()
  }
})

button.addEventListener("click", submit)