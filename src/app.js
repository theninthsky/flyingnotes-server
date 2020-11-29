import uWS from 'uWebSockets.js'
import { StringDecoder } from 'string_decoder'
import jwt from 'jsonwebtoken'

import { patchRequest, patchBody, patchResponse, patchWebSocket } from './patch/index.js'
import { getNewToken, register, login, updateUser, changePassword, logout } from './controllers/users.js'
import { getNotes, createNote, updateNote, deleteNote } from './controllers/notes.js'
import { getFiles, uploadFile, downloadFile, deleteFile } from './controllers/files.js'

const { ACCESS_TOKEN_SECRET, PING_INTERVAL = 30000 } = process.env
const decoder = new StringDecoder('utf8')

const publicRoutes = {
  get: {
    '/get-new-token': getNewToken
  },
  post: {
    '/register': register,
    '/login': login,
    '/logout': logout
  }
}

const messageTypes = {
  updateUser,
  changePassword,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile
}

export default uWS
  .App()
  .any('/*', async (res, req) => {
    res.onAborted(() => {})

    patchResponse(res)

    if (req.getMethod() == 'options') return res.sendStatus(204)

    patchRequest(req)
    await patchBody(req, res)

    try {
      publicRoutes[req.method][req.url](req, res)
    } catch (err) {
      res.sendStatus(404)
    }
  })
  .ws('/*', {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 0,
    upgrade: async (res, req, context) => {
      res.onAborted(() => {})

      const url = req.getUrl()
      const secWebSocketKey = req.getHeader('sec-websocket-key')
      const secWebSocketProtocol = req.getHeader('sec-websocket-protocol')
      const secWebSocketExtensions = req.getHeader('sec-websocket-extensions')

      try {
        jwt.verify(secWebSocketProtocol, ACCESS_TOKEN_SECRET)
        res.upgrade({ url }, secWebSocketKey, secWebSocketProtocol, secWebSocketExtensions, context)
      } catch (err) {
        return res.writeStatus('401').end()
      }
    },
    open: ws => {
      console.log(`A WebSocket connected!`)

      patchWebSocket(ws)
      ws.ping()
    },
    message: (ws, data, isBinary) => {
      const { type, ...message } = JSON.parse(decoder.write(Buffer.from(data)))

      messageTypes[type](ws, message)
    },
    drain: ws => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount())
    },
    pong: ws => {
      setTimeout(() => {
        if (ws.ping && !ws.ping()) ws.close()
      }, +PING_INTERVAL)
    },
    close: (ws, code, message) => {
      console.log('A WebSocket closed')

      ws.ping = null // ws.ping throws an error when called after the socket was closed
    }
  })
