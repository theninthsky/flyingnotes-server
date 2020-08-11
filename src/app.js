import { createServer } from 'http'

import { patchRequest, patchResponse } from './patch.js'
import auth from './auth.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env

const httpMethods = {
  GET: {},
  HEAD: {},
  POST: {},
  PUT: {},
  DELETE: {},
  CONNECT: {},
  TRACE: {},
  PATCH: {},
}

const publicRoutes = {
  ...httpMethods,
  POST: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
  },
}

const privateRoutes = {
  ...httpMethods,
  GET: {
    '/notes': notesController.getNotes,
    '/files': filesController.getFiles,
  },
  POST: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
    '/logout': userController.logoutUser,
    '/notes': notesController.createNote,
    '/files': filesController.uploadFile,
    '/file': filesController.downloadFile,
  },
  PUT: {
    '/update': userController.updateUser,
    '/register': userController.changePassword,
    '/notes': notesController.updateNote,
  },
  DELETE: { '/notes': notesController.deleteNote, '/file': filesController.deleteFile },
}

const defaultRoute = (_, res) => res.sendStatus(404)

export default createServer(async (req, res) => {
  patchResponse(req, res)

  if (req.method == 'OPTIONS') return res.sendStatus(204)

  await patchRequest(req)
  await auth(req, res)

  if (req.expired) return res.status(401).redirect(CLIENT_URL, { clearCookie: true })

  if (req.userID) (privateRoutes[req.method][req.url] || defaultRoute)(req, res)
  else (publicRoutes[req.method][req.url] || defaultRoute)(req, res)
})
