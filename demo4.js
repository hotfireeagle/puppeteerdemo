const WebSocket = require("ws")
const express = require("express")
const cors = require("cors")
const app = express()

app.use(cors())

app.get("/openPage/:url", function (req, res) {
  console.log(req.params.url)
  const ws = new WebSocket("ws://localhost:9222/devtools/page/25AA796DACB44D1C6C1BF4D11EAFDE06", {
    perMessageDeflate: false
  })

  const message = {
    id: 1,
    method: "Page.navigate",
    params: {
      url: req.params.url
    }
  }

  ws.on("open", function open() {
    ws.send(JSON.stringify(message))
  })

  ws.on("message", function incoming(data) {
    console.log(data)
    res.send(data)
  })
})

app.listen(3000)







