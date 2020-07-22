import jwt from 'jsonwebtoken'

import Token from './models/Token.js'
import { generateAccessToken, updateRefreshToken } from './controllers/user.js'

const { ACCESS_TOKEN_SECRET } = process.env

export default async (req, res) => {
  const token = req.headers.cookie && req.headers.cookie.split('=')[1]

  if (!token) return

  try {
    const { userID, refreshTokenID, exp } = jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true })

    if (Date.now() < exp * 1000) return (req.userID = userID)

    const { expiresIn } = await Token.findById(refreshTokenID)
    const dateExpiresIn = new Date(expiresIn)

    if (dateExpiresIn < new Date()) {
      Token.findByIdAndDelete(refreshTokenID, () => {})

      return (req.expired = true)
    }

    generateAccessToken(res, userID, refreshTokenID)
    req.userID = userID
    updateRefreshToken(refreshTokenID)
  } catch (_) {
    return (req.expired = true)
  }
}
