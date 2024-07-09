const express = require("express")
const octaviaAPI = require("octavia-api")
const app = express()

app.use(octaviaAPI.init({
    token: "pass123",
}))

app.listen(3000)