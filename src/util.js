import jwt from 'jsonwebtoken'

import Token from './models/Token.js'

const {
  NODE_ENV,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN = 60 * 10,
  REFRESH_TOKEN_EXPIRES_IN_MONTHS = 3,
} = process.env

const COOKIE_EXPIRES_IN = 3600 * 24 * 31 * REFRESH_TOKEN_EXPIRES_IN_MONTHS
const isProduction = NODE_ENV == 'production'

export const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

export const generateRefreshToken = async userID => {
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

  res.headers['Set-Cookie'] = `Bearer=${accessToken}; Max-Age=${COOKIE_EXPIRES_IN}; HttpOnly; Same-Site=None; ${
    isProduction ? 'Secure' : ''
  }`
}
