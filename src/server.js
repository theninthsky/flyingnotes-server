import https from 'https'

import app from './app.js'
import { connectDB } from './database.js'

const { PORT = 5000, SERVER_URL = 'https://localhost:5000' } = process.env

connectDB(app)

app.on('ready', () => app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`)))
process.on('uncaughtException', err => console.error(err.message || err))

setInterval(() => https.get(SERVER_URL), 900000) // keep Heroku app awake
