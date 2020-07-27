import os from 'os'
import cluster from 'cluster'
import https from 'https'

const {
  NODE_ENV,
  WEB_CONCURRENCY: workers = os.cpus().length, // set by Heroku
  PORT = 5000,
  SERVER_URL = '',
} = process.env

if (cluster.isMaster && NODE_ENV == 'production') {
  console.log(`Master is running...`)

  for (let i = 0; i < workers; i++) {
    cluster.fork()
  }

  cluster.on('exit', worker => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork()
  })

  setInterval(() => https.get(SERVER_URL), 900000) // keep Heroku app awake
} else {
  import('./app.js').then(({ default: app }) => {
    app.listen(PORT, () => console.log(`[Worker ${process.pid}] Listening on port ${PORT}...`))
  })
}
