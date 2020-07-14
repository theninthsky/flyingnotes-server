import uWS from 'uWebSockets.js'
import mongoose from 'mongoose'
// import './patch.js'

import auth from './auth.js'
import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'
import { redirectUser, parseBody } from './util.js'

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

// /* User Routes */
// app.post('/register', userController.registerUser)
// app.post('/login', userController.loginUser)
// app.put('/update', userController.updateUser)
// app.put('/register', userController.changePassword)
// app.post('/logout', userController.logoutUser)

// app.use((req, res, next) => {
//   if (!req.userID) return res.redirect(CLIENT_URL)
//   next()
// })

// /* Notes Routes */
// app.get('/notes', notesController.getNotes)
// app.post('/notes', notesController.createNote)
// app.put('/notes', notesController.updateNote)
// app.delete('/notes', notesController.deleteNote)

// /* Files Routes */
// app.get('/:noteID/file', filesController.getFile)

// /* Default Route */
// app.use((_, res) => res.redirect(CLIENT_URL))

const router = {
  get: { '/notes': notesController.getNotes, [/file/]: filesController.getFile }, // seems impossible
  post: {
    '/register': userController.registerUser,
    '/login': userController.loginUser,
    '/logout': userController.logoutUser,
    '/notes': notesController.createNote,
  },
  put: {
    '/update': userController.updateUser,
    '/register': userController.changePassword,
    '/notes': notesController.updateNote,
  },
  delete: { '/notes': notesController.deleteNote },
}

export default uWS
  .App()
  .options('/*', (res, req) => {
    res
      .writeHeader('Access-Control-Allow-Origin', req.getHeader('origin') || '*')
      .writeHeader('Access-Control-Allow-Credentials', 'true')
      .writeHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS')
      .writeHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end()
  })
  .any('/*', async (res, req) => {
    res
      .writeHeader('Access-Control-Allow-Origin', req.getHeader('origin') || '*')
      .writeHeader('Access-Control-Allow-Credentials', 'true')
      .writeHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS')
      .writeHeader('Access-Control-Allow-Headers', 'Content-Type')

    const method = req.getMethod()
    const url = req.getUrl()

    await auth(res, req)

    if (res.unauthorized) return res.cork(redirectUser)

    req.body = await parseBody(res)

    router[method][url](res, req)
  })
