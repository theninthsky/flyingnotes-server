import mongodb from 'mongodb'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { users, tokens } from '../database.js'
import {
  validateRegisterSchema,
  validateLoginSchema,
  validateUpdateUserSchema,
  validateChangePasswordSchema,
} from '../models/user.js'
import { generateRefreshToken, updateRefreshToken, generateAccessToken } from '../util.js'

const { ACCESS_TOKEN_SECRET, CLIENT_URL = 'http://localhost:3000', BCRYPT_SALT_ROUNDS = 10 } = process.env
const { ObjectID } = mongodb

export const getNewToken = async (req, res) => {
  try {
    const { cookie = '' } = req.headers
    const [token] = cookie.match(/(?<=Bearer=)[\w.-]+/) || []

    if (!token) throw Error()

    const { userID, refreshTokenID, exp } = jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true })

    if (Date.now() < exp * 1000) return res.json({ bearerToken: token, userID })

    const { expiresIn } = await tokens.findOne({ _id: ObjectID(refreshTokenID) })

    if (new Date(expiresIn) < new Date()) {
      tokens.deleteOne({ _id: ObjectID(refreshTokenID) })

      throw Error()
    }

    const newToken = generateAccessToken(res, userID, refreshTokenID)

    updateRefreshToken(refreshTokenID)

    res.json({ bearerToken: newToken, userID })
  } catch (err) {
    res.status(401).redirect(CLIENT_URL, { clearCookie: true })
  }
}

export const register = async (req, res) => {
  if (!validateRegisterSchema(req.body)) return res.sendStatus(400)

  try {
    const { name, email, password, notes = [] } = req.body
    const {
      ops: [user],
    } = await users.insertOne({ name, email, password: await bcrypt.hash(password, +BCRYPT_SALT_ROUNDS), notes })

    console.log(`${user.name} registered`)

    const refreshTokenID = await generateRefreshToken(user._id)
    const token = generateAccessToken(res, user._id, refreshTokenID)

    res.status(201).json({ bearer: token, name: user.name, notes: user.notes })
  } catch (err) {
    res.status(409).send('This email address is already registered, try login instead')
  }
}

export const login = async (req, res) => {
  if (!validateLoginSchema(req.body)) return res.sendStatus(400)

  try {
    const { email, password } = req.body
    const user = await users.findOne({ email: email.toLowerCase() })

    if (!user) return res.status(404).send('No such user')

    const { _id: userID, password: hashedPassword, name, notes } = user
    const match = await bcrypt.compare(password, hashedPassword)

    if (!match) return res.status(404).send('Incorrect email or password')

    const { _id: refreshTokenID = await generateRefreshToken(userID) } = (await tokens.findOne({ userID })) || {}

    const token = generateAccessToken(res, userID, refreshTokenID)

    updateRefreshToken(refreshTokenID)

    res.json({ bearer: token, name, notes })
  } catch (err) {
    console.error(err)

    res.sendStatus(500)
  }
}

export const updateUser = async (ws, message) => {
  if (!validateUpdateUserSchema(message)) return ws.json({ status: 'FAIL' })

  try {
    const { userID, newName } = message

    await users.updateOne({ _id: ObjectID(userID) }, { $set: { name: newName } })

    ws.json({ status: 'SUCCESS', newName })
  } catch (err) {
    console.error(err)

    ws.json({ status: 'FAIL' })
  }
}

export const changePassword = async (ws, message) => {
  if (!validateChangePasswordSchema(message)) return ws.json({ status: 'FAIL' })

  try {
    const { userID, password, newPassword } = message
    const user = await users.findOne({ _id: ObjectID(userID) })

    if (!user) return ws.json({ error: 'Incorrect password' })

    const match = await bcrypt.compare(password, user.password)

    if (!match) return ws.json({ error: 'Not found' })

    await users.updateOne(
      { _id: ObjectID(userID) },
      { $set: { password: await bcrypt.hash(newPassword, +BCRYPT_SALT_ROUNDS) } },
    )
    tokens.deleteOne({ userID: ObjectID(userID) })

    ws.json({ status: 'SUCCESS' })
  } catch (err) {
    console.error(err)

    ws.json({ status: 'FAIL' })
  }
}

export const logout = (_, res) => res.status(204).redirect(CLIENT_URL, { clearCookie: true })