import bcrypt from 'bcryptjs'
import mongodb from 'mongodb'

import { users, tokens } from '../database.js'
import { generateRefreshToken, updateRefreshToken, generateAccessToken } from '../util.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env
const { ObjectID } = mongodb

export const registerUser = async (req, res) => {
  const { name, email, password, notes = [] } = req.body

  try {
    const [user] = (await users.insertOne({ name, email, password: bcrypt.hashSync(password), notes })).ops

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

    if (user) {
      const { _id: userID, password: hashedPassword, name, notes } = user

      const match = await bcrypt.compare(password, hashedPassword)

      if (match) {
        let { _id: refreshTokenID } = (await tokens.findOne({ userID })) || {}

        if (!refreshTokenID) {
          refreshTokenID = await generateRefreshToken(userID)
        }

        generateAccessToken(res, userID, refreshTokenID)
        updateRefreshToken(refreshTokenID)

        res.json({ name, notes })
      } else {
        res.status(404).send('Incorrect email or password')
      }
    } else {
      res.status(404).send('No such user')
    }
  } catch (err) {
    console.error(err)
  }
}

export const updateUser = async (req, res) => {
  try {
    await users.updateOne({ _id: ObjectID(req.userID) }, { $set: { name: req.body.name } })

    res.send()
  } catch (err) {
    console.error(err)
  }
}

export const changePassword = async (req, res) => {
  const {
    userID,
    body: { password, newPassword },
  } = req

  try {
    const user = await users.findOne({ _id: ObjectID(userID) })

    if (user) {
      const match = await bcrypt.compare(password, user.password)

      if (match) {
        await users.updateOne({ _id: ObjectID(userID) }, { $set: { password: bcrypt.hashSync(newPassword) } })
        tokens.deleteOne({ userID: ObjectID(userID) })

        const refreshTokenID = await generateRefreshToken(userID)

        generateAccessToken(res, userID, refreshTokenID)

        res.sendStatus(200)
      } else {
        res.status(404).send('Incorrect password')
      }
    } else {
      res.sendStatus(404)
    }
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const logoutUser = (_, res) => {
  res.status(204).redirect(CLIENT_URL, { clearCookie: true })
}
