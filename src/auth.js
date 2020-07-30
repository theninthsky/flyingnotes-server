import jwt from 'jsonwebtoken'
import mongodb from 'mongodb'

import { tokens } from './database.js'
import { generateAccessToken, updateRefreshToken } from './util.js'

const { ACCESS_TOKEN_SECRET } = process.env
const { ObjectID } = mongodb

export default async (req, res) => {
  const { cookie = '' } = req.headers
  const [token] = cookie.match(/(?<=Bearer=)[\w.-]+/) || []

  if (!token) return

  try {
    const { userID, refreshTokenID, exp } = jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true })

    if (Date.now() < exp * 1000) return (req.userID = userID)

    const { expiresIn } = await tokens.findOne({ _id: ObjectID(refreshTokenID) })

    if (new Date(expiresIn) < new Date()) {
      tokens.deleteOne({ _id: ObjectID(refreshTokenID) })

      return (req.expired = true)
    }

    generateAccessToken(res, userID, refreshTokenID)
    req.userID = userID
    updateRefreshToken(refreshTokenID)
  } catch (err) {
    return (req.expired = true)
  }
}
