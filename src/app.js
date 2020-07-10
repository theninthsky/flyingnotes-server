import uWS from 'uWebSockets.js'
import mongoose from 'mongoose'

import auth from './middleware/auth.js'

import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { NODE_ENV, MONGODB_URI = 'mongodb://localhost/main', CLIENT_URL = 'http://localhost:3000' } = process.env

export const redirectUser = () => {
  res
    .writeStatus(303)
    .writeHeader('Set-Cookie', 'Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    .writeHeader('Location', CLIENT_URL)
}

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

export default uWS
  .App()
  .options('/*', (res, req) => {
    res
      .writeHeader('Access-Control-Allow-Origin', req.getHeader('origin') || '*')
      .writeHeader('Access-Control-Allow-Credentials', 'true')
      .writeHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS')
      .writeHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end()
  })
  .any('/*', async (res, req) => {
    await auth(res, req)

    req.setYield(true)
  })
  .post('/register', userController.registerUser)
  .post('/login', userController.loginUser)
  .put('/update', userController.updateUser)
  .put('/register', userController.changePassword)
  .post('/logout', userController.logoutUser)
