import uWS from 'uWebSockets.js'
import { StringDecoder } from 'string_decoder'
import jwt from 'jsonwebtoken'

import { patchRequest, patchResponse, patchBody, patchWebsocket } from './patch.js'
import { getNewToken, register, login, updateUser, changePassword, logout } from './controllers/user.js'
import { getNotes, addNote, updateNote, deleteNote } from './controllers/notes.js'
import { getFiles, deleteFile } from './controllers/files.js'

const { CLIENT_URL = 'http://localhost:3000', ACCESS_TOKEN_SECRET } = process.env
const decoder = new StringDecoder('utf8')

const publicRoutes = {
  get: {
    '/get-new-token': getNewToken,
  },
  post: {
    '/register': register,
    '/login': login,
    '/logout': logout,
  },
}

const websocketActions = {
  updateUser,
  changePassword,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  getFiles,
  deleteFile,
}

const defaultRoute = (_, res) => res.sendStatus(404)

export default uWS
  .App()
  .any('/*', async (res, req) => {
    res.onAborted(() => {})

    patchResponse(res)

    if (req.getMethod() == 'options') return res.sendStatus(204)

    patchRequest(req)

    await patchBody(req, res)

    return (publicRoutes[req.method] ? publicRoutes[req.method][req.url] || defaultRoute : defaultRoute)(req, res)
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
      console.log('A WebSocket connected!')
    },
    message: async (ws, message, isBinary) => {
      patchWebsocket(ws)

      const body = JSON.parse(decoder.write(Buffer.from(message)))

      websocketActions[body.action](ws, body)
    },
    drain: ws => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount())
    },
    close: (ws, code, message) => {
      console.log('WebSocket closed')
    },
  })
