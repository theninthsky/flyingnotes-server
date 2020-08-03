import { createServer } from 'http'

import { patchRequest, patchResponse } from './patch.js'
import auth from './auth.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env

const publicRouter = {
  POST: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
  },
}

const privateRouter = {
  GET: { '/notes': notesController.getNotes },
  POST: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
    '/logout': userController.logoutUser,
    '/notes': notesController.createNote,
    '/file': filesController.getFile,
  },
  PUT: {
    '/update': userController.updateUser,
    '/register': userController.changePassword,
    '/notes': notesController.updateNote,
  },
  DELETE: { '/notes': notesController.deleteNote },
}

export default createServer(async (req, res) => {
  patchResponse(req, res)

  if (req.method == 'OPTIONS') return res.sendStatus(204)

  await patchRequest(req)
  await auth(req, res)

  if (req.expired) return res.status(401).redirect(CLIENT_URL, { clearCookie: true })
  if (req.userID && privateRouter[req.method][req.url]) return privateRouter[req.method][req.url](req, res)
  if (publicRouter[req.method][req.url]) return publicRouter[req.method][req.url](req, res)

  res.sendStatus(404)
})
