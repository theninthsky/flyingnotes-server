import mongodb from 'mongodb'
import mongoDBMemoryServer from 'mongodb-memory-server'

const { MongoMemoryServer } = mongoDBMemoryServer

export default async () => {
  const mongoURI = await new MongoMemoryServer().getUri()
  const client = new mongodb.MongoClient(mongoURI, { useUnifiedTopology: true, ignoreUndefined: true })

  return client.connect()
}
