import mongoose from 'mongoose'
import mongoDBMemoryServer from 'mongodb-memory-server'

import { mongooseOpts } from '../../src/app.js'

const { MongoMemoryServer } = mongoDBMemoryServer

export default async () => {
  const mongoURI = await new MongoMemoryServer().getUri()

  return mongoose.connect(mongoURI, mongooseOpts)
}
