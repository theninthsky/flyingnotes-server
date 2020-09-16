import mongodb from 'mongodb'
import jwt from 'jsonwebtoken'

import { tokens } from './database.js'

const {
  NODE_ENV,
  CLIENT_URL = 'http://localhost:3000',
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN = 60 * 10,
  REFRESH_TOKEN_EXPIRES_IN_MONTHS = 3,
} = process.env
const { ObjectID } = mongodb

const COOKIE_EXPIRES_IN = 3600 * 24 * 30 * REFRESH_TOKEN_EXPIRES_IN_MONTHS
const isProduction = NODE_ENV == 'production'

export const corsHeaders = {
  'Access-Control-Allow-Origin': CLIENT_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const generateRefreshToken = async userID => {
  const date = new Date()

  date.setMonth(date.getMonth() + REFRESH_TOKEN_EXPIRES_IN_MONTHS)

  const [{ _id }] = (await tokens.insertOne({ userID: ObjectID(userID), expiresIn: date.toISOString() })).ops

  return _id
}

export const updateRefreshToken = refreshTokenID => {
  const date = new Date()

  date.setMonth(date.getMonth() + REFRESH_TOKEN_EXPIRES_IN_MONTHS)
  tokens.updateOne({ _id: ObjectID(refreshTokenID) }, { $set: { expiresIn: date.toISOString() } })
}

export const generateAccessToken = (userID, refreshTokenID) => {
  const payload = {
    iss: 'flyingnotes',
    userID,
    refreshTokenID,
  }

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}
