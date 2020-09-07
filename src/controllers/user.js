import mongodb from 'mongodb'
import bcrypt from 'bcrypt'

import { users, tokens } from '../database.js'
import { generateRefreshToken, updateRefreshToken, generateAccessToken } from '../util.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env
const { ObjectID } = mongodb
const SALT_ROUNDS = 10

export const registerUser = async (req, res) => {
  const { name, email, password, notes = [] } = req.body

  try {
    const {
      ops: [user],
    } = await users.insertOne({ name, email, password: await bcrypt.hash(password, SALT_ROUNDS), notes })

    console.log(`${user.name} registered`)

    const refreshTokenID = await generateRefreshToken(user._id)

    generateAccessToken(res, user._id, refreshTokenID)

    res.status(201).json({ name: user.name, notes: user.notes })
  } catch (err) {
    res.status(409).send('This email address is already registered, try login instead')
  }
}

export const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await users.findOne({ email: email.toLowerCase() })

    if (!user) return res.status(404).send('No such user')

    const { _id: userID, password: hashedPassword, name, notes } = user
    const match = await bcrypt.compare(password, hashedPassword)

    if (!match) return res.status(404).send('Incorrect email or password')

    let { _id: refreshTokenID = await generateRefreshToken(userID) } = (await tokens.findOne({ userID })) || {}

    generateAccessToken(res, userID, refreshTokenID)
    updateRefreshToken(refreshTokenID)

    res.json({ name, notes })
  } catch (err) {
    console.error(err)

    res.sendStatus(500)
  }
}

export const updateUser = async (req, res) => {
  try {
    await users.updateOne({ _id: ObjectID(req.userID) }, { $set: { name: req.body.name } })

    res.sendStatus(200)
  } catch (err) {
    console.error(err)

    res.sendStatus(500)
  }
}

export const changePassword = async (req, res) => {
  const {
    userID,
    body: { password, newPassword },
  } = req

  try {
    const user = await users.findOne({ _id: ObjectID(userID) })

    if (!user) return res.status(404).send('Incorrect password')

    const match = await bcrypt.compare(password, user.password)

    if (!match) return res.sendStatus(404)

    await users.updateOne(
      { _id: ObjectID(userID) },
      { $set: { password: await bcrypt.hash(newPassword, SALT_ROUNDS) } },
    )
    tokens.deleteOne({ userID: ObjectID(userID) })

    const refreshTokenID = await generateRefreshToken(userID)

    generateAccessToken(res, userID, refreshTokenID)

    res.sendStatus(200)
  } catch (err) {
    console.error(err)

    res.sendStatus(500)
  }
}

export const logoutUser = (_, res) => {
  res.status(204).redirect(CLIENT_URL, { clearCookie: true })
}
