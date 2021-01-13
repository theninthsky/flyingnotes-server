import mongodb from 'mongodb'
import jwt from 'jsonwebtoken'

import { tokens } from './database.js'

const {
  NODE_ENV,
  CLIENT_URL = 'http://localhost:3000',
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN = 1 * 60,
  REFRESH_TOKEN_EXPIRES_IN_MONTHS = 3
} = process.env
const { ObjectID } = mongodb

const COOKIE_EXPIRES_IN = REFRESH_TOKEN_EXPIRES_IN_MONTHS * 30 * 24 * 60 * 60
const isProduction = NODE_ENV == 'production'

export const corsHeaders = {
  'Access-Control-Allow-Origin': CLIENT_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': `${24 * 60 * 60}`
}

export const verifyToken = async req => {
  const { cookie = '' } = req.headers
  const [token] = cookie.match(/(?<=Bearer=)[\w.-]+/) || []

  if (!token) throw Error()

  const { userID, refreshTokenID, exp } = jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true })

  if (Date.now() < exp * 1000) return { userID, refreshTokenID }

  const { expiresIn } = (await tokens.findOne({ _id: ObjectID(refreshTokenID) })) || {}

  if (!expiresIn) throw Error()
  if (new Date(expiresIn) < new Date()) {
    tokens.deleteOne({ _id: ObjectID(refreshTokenID) })

    throw Error()
  }

  return { userID, refreshTokenID }
}

export const generateRefreshToken = async userID => {
  const date = new Date()

  date.setMonth(date.getMonth() + REFRESH_TOKEN_EXPIRES_IN_MONTHS)

  const [{ _id }] = (await tokens.insertOne({ userID: ObjectID(userID), expiresIn: date.toISOString() })).ops

  return _id
}

export const touchRefreshToken = refreshTokenID => {
  const date = new Date()

  date.setMonth(date.getMonth() + REFRESH_TOKEN_EXPIRES_IN_MONTHS)
  tokens.updateOne({ _id: ObjectID(refreshTokenID) }, { $set: { expiresIn: date.toISOString() } })
}

export const generateAccessToken = (res, userID, refreshTokenID) => {
  const payload = {
    iss: 'flyingnotes',
    userID,
    refreshTokenID
  }

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  })

  res.setHeader(
    'Set-Cookie',
    `Bearer=${accessToken}; Max-Age=${COOKIE_EXPIRES_IN}; HttpOnly; SameSite=None${isProduction ? '; Secure' : ''}`
  )

  return accessToken
}
