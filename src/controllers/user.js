import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'
import Token from '../models/Token.js'

const {
  NODE_ENV,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN = 60 * 10,
  REFRESH_TOKEN_EXPIRES_IN_MONTHS = 3,
} = process.env

const COOKIE_EXPIRES_IN = 1000 * 3600 * 24 * 31 * REFRESH_TOKEN_EXPIRES_IN_MONTHS
const isProduction = NODE_ENV == 'production'

const generateRefreshToken = async userID => {
  const date = new Date()
  date.setMonth(date.getMonth() + REFRESH_TOKEN_EXPIRES_IN_MONTHS)

  const { _id } = await new Token({ userID, expiresIn: date.toISOString() }).save()

  return _id
}

export const updateRefreshToken = refreshTokenID => {
  const date = new Date()
  date.setMonth(date.getMonth() + REFRESH_TOKEN_EXPIRES_IN_MONTHS)

  Token.findByIdAndUpdate(refreshTokenID, { expiresIn: date.toISOString() }, () => {})
}

export const generateAccessToken = (res, userID, refreshTokenID) => {
  const payload = {
    iss: 'flyingnotes',
    userID,
    refreshTokenID,
  }

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })

  res.cookie('Bearer', accessToken, {
    maxAge: COOKIE_EXPIRES_IN,
    httpOnly: true,
    secure: isProduction,
  })
}

export const registerUser = (req, res) => {
  const { name, email, password, notes = [] } = req.body

  new User({ name, email, password: bcrypt.hashSync(password), notes })
    .save()
    .then(async ({ _id: userID, name, notes }) => {
      console.log(name + ' registered')

      const refreshTokenID = await generateRefreshToken(userID)

      generateAccessToken(res, userID, refreshTokenID)

      res.status(201).json({ name, notes })
    })
    .catch(({ message, errmsg }) => {
      console.error(`Error: ${message || errmsg}`)
      res.status(409).send('This email address is already registered, try login instead')
    })
}

export const loginUser = (req, res) => {
  const { email, password } = req.body

  User.findOne({ email: email.toLowerCase() })
    .then(async user => {
      if (user) {
        const { _id: userID, password: hashedPassword, name, notes } = user

        try {
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
        } catch ({ message }) {
          throw Error(message)
        }
      } else {
        res.status(404).send('No such user exists')
      }
    })
    .catch(({ message, errmsg }) => console.error(`Error: ${message || errmsg}`))
}

export const updateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userID, { name: req.body.name })

    res.sendStatus(200)
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const changePassword = (req, res) => {
  const { userID } = req
  const { password, newPassword } = req.body

  User.findById(userID)
    .then(async user => {
      if (user) {
        try {
          const match = await bcrypt.compare(password, user.password)

          if (match) {
            user.password = bcrypt.hashSync(newPassword)

            await user.save()

            await Token.findOneAndDelete({ userID })

            const refreshTokenID = await generateRefreshToken(userID)

            generateAccessToken(res, userID, refreshTokenID)

            res.sendStatus(200)
          } else {
            res.status(404).send('Incorrect password')
          }
        } catch ({ message }) {
          throw Error(message)
        }
      } else {
        res.sendStatus(404)
      }
    })
    .catch(({ message, errmsg }) => console.error(`Error: ${message || errmsg}`))
}

export const logoutUser = (_, res) => {
  res.clearCookie('Bearer').sendStatus(204)
}
