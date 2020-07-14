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

const COOKIE_EXPIRES_IN = 3600 * 24 * 31 * REFRESH_TOKEN_EXPIRES_IN_MONTHS
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

  res.writeHeader(
    'Set-Cookie',
    `Bearer=${accessToken}; Max-Age=${COOKIE_EXPIRES_IN}; HttpOnly; ${isProduction ? 'Secure' : ''}`,
  )
}

export const registerUser = (res, req) => {
  const { name, email, password, notes = [] } = req.body

  new User({ name, email, password: bcrypt.hashSync(password), notes })
    .save()
    .then(async ({ _id: userID, name, notes }) => {
      console.log(name + ' registered')

      const refreshTokenID = await generateRefreshToken(userID)

      generateAccessToken(res, userID, refreshTokenID)

      res.writeStatus(201).end(JSON.stringify({ name, notes }))
    })
    .catch(({ message, errmsg }) => {
      console.error(`Error: ${message || errmsg}`)
      res.writeStatus(409).send('This email address is already registered, try login instead')
    })
}

export const loginUser = (res, req) => {
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

            res.cork(() => {
              res.writeHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ name, notes }))
            })
          } else {
            res.writeStatus(404).end('Incorrect email or password')
          }
        } catch ({ message }) {
          throw Error(message)
        }
      } else {
        res.writeStatus(404).end('No such user')
      }
    })
    .catch(({ message, errmsg }) => console.error(`Error: ${message || errmsg}`))
}

export const updateUser = async (res, req) => {
  try {
    await User.findByIdAndUpdate(req.userID, { name: req.body.name })

    res.end()
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const changePassword = (res, req) => {
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

            res.end()
          } else {
            res.writeStatus(404).end('Incorrect password')
          }
        } catch ({ message }) {
          throw Error(message)
        }
      } else {
        res.writeStatus(404).end()
      }
    })
    .catch(({ message, errmsg }) => console.error(`Error: ${message || errmsg}`))
}

export const logoutUser = res => {
  res.cork(() =>
    res.writeHeader('Set-Cookie', `Bearer=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`).writeStatus('204 OK').end(),
  )
}
