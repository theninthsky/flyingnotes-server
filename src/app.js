import uWS from 'uWebSockets.js'
import { StringDecoder } from 'string_decoder'
import jwt from 'jsonwebtoken'

import { patchRequest, patchResponse, patchBody } from './patch.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { CLIENT_URL = 'http://localhost:3000', ACCESS_TOKEN_SECRET } = process.env
const decoder = new StringDecoder('utf8')

const publicRoutes = {
  post: {
    '/get-new-token': userController.getNewToken,
    '/register': userController.registerUser,
    '/login': userController.loginUser,
  },
}

const privateRoutes = {
  get: {
    '/notes': notesController.getNotes,
    '/files': filesController.getFiles,
  },
  post: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
    '/logout': userController.logoutUser,
    '/notes': notesController.createNote,
    '/files': filesController.uploadFile,
    '/file': filesController.downloadFile,
  },
  put: {
    '/update': userController.updateUser,
    '/register': userController.changePassword,
    '/notes': notesController.updateNote,
  },
  delete: { '/notes': notesController.deleteNote, '/file': filesController.deleteFile },
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
      const body = JSON.parse(decoder.write(Buffer.from(message)))

      console.log(body)

      switch (body.action) {
        case 'getNotes':
          notesController.getNotes(ws, body)
      }
    },
    drain: ws => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount())
    },
    close: (ws, code, message) => {
      console.log('WebSocket closed')
    },
  })
