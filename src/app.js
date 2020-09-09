import uWS from 'uWebSockets.js'

import { patchRequest, patchResponse, patchPayload } from './patch.js'
import auth from './auth.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env

const publicRoutes = {
  post: {
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

export default uWS.App().any('/*', async (res, req) => {
  res.onAborted(() => {
    res.aborted = true
  })

  patchRequest(req)
  patchResponse(req, res)

  if (req.method == 'options') return res.sendStatus(204)

  await patchPayload(req, res)
  await auth(req, res)

  if (req.expired) return res.status(401).redirect(CLIENT_URL, { clearCookie: true })
  if (!req.userID) {
    return (publicRoutes[req.method] ? publicRoutes[req.method][req.url] || defaultRoute : defaultRoute)(req, res)
  }

  ;(privateRoutes[req.method] ? privateRoutes[req.method][req.url] || defaultRoute : defaultRoute)(req, res)
})
