import https from 'https'

const { PORT = 5000, SERVER_URL = '' } = process.env

import('./database.js').then(async ({ connect }) => {
  try {
    await connect()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  const { default: app } = await import('./app.js')

  app.listen(+PORT, token => console.log(`${token ? 'Listening on port' : 'Failed to listen to port'} ${PORT}...`))
})

setInterval(() => https.get(SERVER_URL), 900000) // keep Heroku app awake

process.on('uncaughtException', err => console.log(err.stack))
