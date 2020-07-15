import { createServer } from 'http'
import mongoose from 'mongoose'

import patchResponse from './patch.js'
import auth from './auth.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'
import { parseBody } from './util.js'

const { NODE_ENV, MONGODB_URI = 'mongodb://localhost/main' } = process.env

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

// export default uWS
//   .App()
//   .options('/*', (res, req) => {
//     cors(res, req)
//     res.end()
//   })
//   .any('/*', async (res, req) => {
//     const method = req.getMethod()
//     const url = req.getUrl()

//     registerSend(res, req)

//     await auth(res, req)

//     if (res.unauthorized) return res.cork(redirectUser)

//     req.body = await parseBody(res)
//     router[method][url](res, req)
//   })

export default createServer(async (req, res) => {
  patchResponse(req, res)

  if (req.method == 'OPTIONS') return res.send()

  await parseBody(req)
  await auth(req, res)
  // if (res.unauthorized) return res.redirect(redirectUser)

  res.headers = {}

  router[req.method][req.url](req, res)
})
