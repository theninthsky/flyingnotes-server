import mongodb from 'mongodb'

import { files } from '../database.js'
import { validateUserID } from '../models/user.js'
import { validateDeleteFile } from '../models/file.js'

const { ObjectID } = mongodb

export const getFiles = async (ws, message) => {
  try {
    if (!validateUserID(message)) throw Error('Invalid parameters')

    const { messageID, userID } = message

    const allFiles = await files.find({ userID: ObjectID(userID) }, { projection: { userID: 0, base64: 0 } }).toArray()

    ws.json({ messageID, files: allFiles })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const uploadFile = async (ws, message) => {
  const { messageID, userID, file: { category, name, extension, base64 } = {} } = message

  if (!base64) return ws.json({ error: 'No file' })

  try {
    const {
      ops: [file],
    } = await files.insertOne(
      {
        userID: ObjectID(userID),
        category,
        name,
        extension,
        base64,
        date: new Date(),
      },
      /*{ projection: { userID: 0, base64: 0 } } has no effect */
    )

    delete file.userID
    delete file.base64

    ws.json({ messageID, file })
  } catch (err) {
    console.log(err)

    ws.send()
  }
}

export const downloadFile = async (ws, { messageID, userID, fileID }) => {
  try {
    const { _id, name, extension, base64 } = await files.findOne({ _id: ObjectID(fileID), userID: ObjectID(userID) })

    ws.json({ messageID, fileID: _id, name, extension, base64 })
  } catch (err) {
    console.log(err)

    ws.send()
  }
}

export const deleteFile = async (ws, message) => {
  try {
    if (!validateDeleteFile(message)) throw Error('Invalid parameters')

    const { messageID, userID, fileID } = message

    await files.deleteOne({ _id: ObjectID(fileID), userID: ObjectID(userID) })

    ws.json({ messageID, fileID, status: 'SUCCESS' })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}
