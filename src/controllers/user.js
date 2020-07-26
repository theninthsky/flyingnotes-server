import bcrypt from 'bcryptjs'

import User from '../models/User.js'
import Token from '../models/Token.js'
import { generateRefreshToken, updateRefreshToken, generateAccessToken } from '../util.js'

const { CLIENT_URL = 'http://localhost:3000' } = process.env

export const registerUser = async (req, res) => {
  const { name, email, password, notes = [] } = req.body

  try {
    const user = await new User({
      name,
      email,
      password: bcrypt.hashSync(password),
      notes,
    }).save()

    console.log(`${user.name}  registered`)

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
    const user = await User.findOne({ email: email.toLowerCase() })

    if (user) {
      const { _id: userID, password: hashedPassword, name, notes } = user

      const match = await bcrypt.compare(password, hashedPassword)

      if (match) {
        let { _id: refreshTokenID } = (await Token.findOne({ userID })) || {}

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
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const updateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userID, { name: req.body.name })

    res.send()
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const changePassword = async (req, res) => {
  const {
    userID,
    body: { password, newPassword },
  } = req

  try {
    const user = await User.findById(userID)

    if (user) {
      const match = await bcrypt.compare(password, user.password)

      if (match) {
        user.password = bcrypt.hashSync(newPassword)

        await user.save()
        await Token.findOneAndDelete({ userID })

        const refreshTokenID = await generateRefreshToken(userID)

        generateAccessToken(res, userID, refreshTokenID)

        res.send()
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
