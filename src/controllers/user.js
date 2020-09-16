import mongodb from 'mongodb'
import bcrypt from 'bcrypt'

import { users, tokens } from '../database.js'
import { generateRefreshToken, updateRefreshToken, generateAccessToken } from '../util.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env
const { ObjectID } = mongodb
const SALT_ROUNDS = 10

export const registerUser = async (ws, body) => {
  const { name, email, password, notes = [] } = body

  try {
    const {
      ops: [user],
    } = await users.insertOne({ name, email, password: await bcrypt.hash(password, SALT_ROUNDS), notes })

    console.log(`${user.name} registered`)

    const refreshTokenID = await generateRefreshToken(user._id)
    const accessToken = generateAccessToken(user._id, refreshTokenID)

    ws.send(JSON.stringify({ accessToken, name: user.name, notes: user.notes }))
  } catch (err) {
    ws.send('This email address is already registered, try login instead')
  }
}

export const loginUser = async (ws, body) => {
  const { email, password } = body

  try {
    const user = await users.findOne({ email: email.toLowerCase() })

    if (!user) return ws.send('No such user')

    const { _id: userID, password: hashedPassword, name, notes } = user
    const match = await bcrypt.compare(password, hashedPassword)

    if (!match) return ws.send('Incorrect email or password')

    const { _id: refreshTokenID = await generateRefreshToken(userID) } = (await tokens.findOne({ userID })) || {}

    updateRefreshToken(refreshTokenID)

    const accessToken = generateAccessToken(userID, refreshTokenID)

    ws.send(JSON.stringify({ accessToken, name, notes }))
  } catch (err) {
    console.error(err)

    ws.send()
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
