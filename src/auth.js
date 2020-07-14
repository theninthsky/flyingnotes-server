import jwt from 'jsonwebtoken'

import Token from './models/Token.js'
import { generateAccessToken, updateRefreshToken } from './controllers/user.js'

const { ACCESS_TOKEN_SECRET } = process.env

export default async (res, req) => {
  const token = req.getHeader('Bearer')

  if (!token) return

  try {
    const { userID, refreshTokenID, exp } = jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true })

    if (Date.now() < exp * 1000) return (req.userID = userID)

    const { expiresIn } = await Token.findById(refreshTokenID)

    const dateExpiresIn = new Date(expiresIn)

    if (dateExpiresIn < new Date()) {
      Token.findByIdAndDelete(refreshTokenID, () => {})

      return (res.unauthorized = true)
    }

    generateAccessToken(res, userID, refreshTokenID)
    req.userID = userID

    updateRefreshToken(refreshTokenID)
  } catch (_) {
    return (res.unauthorized = true)
  }
}
