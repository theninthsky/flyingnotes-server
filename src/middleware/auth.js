import jwt from 'jsonwebtoken'

import Token from '../models/Token.js'
import { generateAccessToken, updateRefreshToken } from '../controllers/user.js'

const { ACCESS_TOKEN_SECRET, CLIENT_URL = 'http://localhost:3000' } = process.env

export default (req, res, next) => {
  const { Bearer: token } = req.cookies

  if (!token) return next()

  jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true }, async (err, { userID, refreshTokenID, exp }) => {
    if (err) return res.clearCookie('Bearer').redirect(CLIENT_URL)

    if (Date.now() < exp * 1000) {
      req.userID = userID
      return next()
    }

    try {
      const { expiresIn } = await Token.findById(refreshTokenID)

      const dateExpiresIn = new Date(expiresIn)

      if (dateExpiresIn < new Date()) {
        Token.findByIdAndDelete(refreshTokenID, () => {})

        return res.clearCookie('Bearer').redirect(CLIENT_URL)
      }

      generateAccessToken(res, userID, refreshTokenID)
      req.userID = userID

      updateRefreshToken(refreshTokenID)

      next()
    } catch (err) {
      return res.clearCookie('Bearer').redirect(CLIENT_URL)
    }
  })
}
