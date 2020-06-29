import jwt from 'jsonwebtoken'

import Token from '../models/Token.js'
import { generateAccessToken, updateRefreshToken } from '../controllers/user.js'

const { ACCESS_TOKEN_SECRET, CLIENT_URL = 'http://localhost:3000' } = process.env
const TOKEN_EXPIRED_ERROR = 'TokenExpiredError'

export default (req, res, next) => {
  const { Bearer: token } = req.cookies

  if (!token) return next()

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name == TOKEN_EXPIRED_ERROR) {
        jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true }, async (_, { userID, refreshTokenID }) => {
          try {
            const { expiresIn } = await Token.findById(refreshTokenID)

            const dateExpiresIn = new Date(expiresIn)

            if (dateExpiresIn < new Date()) {
              Token.findByIdAndDelete(refreshTokenID, () => {})

              return res.clearCookie('Bearer').sendStatus(401)
            }

            generateAccessToken(res, userID, refreshTokenID)
            req.userID = userID

            updateRefreshToken(refreshTokenID)

            next()
          } catch (err) {
            return res.clearCookie('Bearer').redirect(CLIENT_URL)
          }
        })
      } else {
        return res.clearCookie('Bearer').redirect(CLIENT_URL)
      }
    } else {
      req.userID = decoded.userID
      next()
    }
  })
}
