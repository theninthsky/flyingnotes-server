import mongoose from 'mongoose'

const tokenSchema = new mongoose.Schema({
  userID: String,
  expiresIn: String,
})

export default mongoose.model('Token', tokenSchema)
