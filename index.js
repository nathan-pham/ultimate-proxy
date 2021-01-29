const express = require("express")
const path = require("path")

const endpoints = require("./endpoints")
const config = require("./config")
const Proxy = require("./proxy")

const app = express()
const unblocker = new Proxy()

app.use(unblocker.app())

app.engine("html", require("ejs").renderFile)
app.set("views", path.join(__dirname, "templates"))
app.set("view engine", "html")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

for(const endpoint of endpoints) {
	endpoint(app, config)
}

const server = app.listen(config.port, () => {
	console.log("Server started on port", config.port)
})

unblocker.ws(server)
