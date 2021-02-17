import { createServer } from 'http'
import WebSocket from 'ws'

import { verifyToken } from './util.js'
import { patchRequest, patchResponse, patchWebSocket } from './patch/index.js'
import { restControllers, wsControllers } from './controllers/index.js'

const { PING_INTERVAL = 30000 } = process.env

const server = createServer(async (req, res) => {
  patchResponse(res)

  if (req.method == 'OPTIONS') return res.sendStatus(204)

  await patchRequest(req)

  try {
    restControllers[req.method][req.url](req, res)
  } catch {
    res.sendStatus(404)
  }
})

server.on('upgrade', async (req, socket) => {
  try {
    await verifyToken(req)
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
  }
})

const wss = new WebSocket.Server({ server })

wss.on('connection', ws => {
  console.log('A WebSocket connected!')

  patchWebSocket(ws)

  ws.on('message', data => {
    const { type, ...message } = JSON.parse(data)

    wsControllers[type](ws, message)
  })

  ws.isAlive = true

  ws.on('pong', function () {
    this.isAlive = true
  })

  const pingInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate()

      ws.isAlive = false
      ws.ping()
    })
  }, PING_INTERVAL)

  ws.on('close', () => {
    console.log('A WebSocket disconnected!')
    clearInterval(pingInterval)
  })
})

export default server
