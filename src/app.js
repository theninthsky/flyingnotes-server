import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import helmet from 'helmet'
import cors from 'cors'

import auth from './middleware/auth.js'

import * as userController from './controllers/user.js'
import * as notesController from './controllers/notes.js'
import * as filesController from './controllers/files.js'

const { NODE_ENV, MONGODB_URI = 'mongodb://localhost/main', CLIENT_URL = 'http://localhost:3000' } = process.env

const app = express()

const mongooseOpts = {
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
} else {
  import('mongodb-memory-server').then(({ default: { MongoMemoryServer } }) => {
    const mongoServer = new MongoMemoryServer()

    mongoServer.getUri().then(mongoURI => {
      mongoose
        .connect(mongoURI, mongooseOpts)
        .then(() => console.log('MongoDB Memory Server is connected...'))
        .catch(({ message }) => console.error(`Error: ${message}`))
    })
  })
}

app.use(express.json())
app.use(cookieParser())
app.use(multer({ limits: { fileSize: 1024 * 1024 * 10 } }).single('file'))
app.use(helmet())
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
)

app.use(auth)

/* User Routes */
app.post('/register', userController.registerUser)
app.post('/login', userController.loginUser)
app.put('/update', userController.updateUser)
app.put('/register', userController.changePassword)
app.post('/logout', userController.logoutUser)

app.use((req, res, next) => {
  if (!req.userID) return res.redirect(CLIENT_URL)
  next()
})

/* Notes Routes */
app.get('/notes', notesController.getNotes)
app.post('/notes', notesController.createNote)
app.put('/notes', notesController.updateNote)
app.delete('/notes', notesController.deleteNote)

/* Files Routes */
app.get('/:noteID/file', filesController.getFile)

/* Default Route */
app.use((_, res) => {
  res.redirect(CLIENT_URL)
})

export default app
