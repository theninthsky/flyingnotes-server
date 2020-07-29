import mongodb from 'mongodb'

const { NODE_ENV, MONGODB_URI = 'mongodb://localhost/main', DB_NAME = 'main' } = process.env
const client = new mongodb.MongoClient(MONGODB_URI, { useUnifiedTopology: true })

export let users
export let tokens
export let files

export const connect = async () => {
  if (NODE_ENV != 'test') {
    try {
      await client.connect()

      console.log(`[Worker ${process.pid}] MongoDB is connected...`)

      const db = client.db(DB_NAME)

      users = db.collection('users')
      tokens = db.collection('tokens')
      files = db.collection('files')
    } catch (err) {
      console.error(err)
    }
  }
}
