import cluster from 'cluster'
import https from 'https'

const { PORT = 5000, SERVER_URL = '' } = process.env

if (cluster.isMaster) {
  console.log(`Master is running...`)

  cluster.fork()

  cluster.on('exit', worker => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork()
  })

  setInterval(() => https.get(SERVER_URL), 900000) // keep Heroku app awake
} else {
  import('./database.js').then(async ({ connect }) => {
    try {
      await connect()
    } catch (err) {
      console.error(err)
      process.exit(1)
    }

    const { default: app } = await import('./app.js')

    app.listen(+PORT, token =>
      console.log(`[Worker ${process.pid}] ${token ? 'Listening on port' : 'Failed to listen to port'} ${PORT}...`),
    )
  })
}
