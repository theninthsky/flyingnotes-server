import { createServer } from 'http'
import mongoose from 'mongoose'

import { patchRequest, patchResponse } from './patch.js'
import auth from './auth.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { NODE_ENV, MONGODB_URI = 'mongodb://localhost/main', CLIENT_URL = 'http://localhost:3000' } = process.env

export const mongooseOpts = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
}

if (NODE_ENV != 'test') {
  mongoose
    .connect(MONGODB_URI, mongooseOpts)
    .then(() => console.log(`[Worker ${process.pid}] MongoDB is connected...`))
    .catch(({ message }) => console.error(`Error: ${message}`))
}

const router = {
  GET: { '/notes': notesController.getNotes, [/file/]: filesController.getFile }, // seems impossible
  POST: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
    '/logout': userController.logoutUser,
    '/notes': notesController.createNote,
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

  if (req.method == 'OPTIONS') return res.send()

  await patchRequest(req)
  await auth(req, res)

  if (req.expired) return res.status(401).redirect(CLIENT_URL, { clearCookie: true })

  res.headers = {}
  router[req.method][req.url](req, res)
})
