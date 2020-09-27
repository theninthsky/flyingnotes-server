import mongodb from 'mongodb'

import { files } from '../database.js'
import { validateUserID } from '../models/user.js'
import { validateDeleteFile } from '../models/file.js'

const { ObjectID } = mongodb

export const getFiles = async (ws, message) => {
  try {
    if (!validateUserID(message)) throw Error('Invalid parameters')

    const allFiles = await files
      .find({ userID: ObjectID(message.userID) }, { projection: { userID: 0, mimetype: 0, buffer: 0 } })
      .toArray()

    ws.json({ files: allFiles })
  } catch ({ message }) {
    ws.json({ status: 'FAIL', message })
  }
}

// export const uploadFile = async (ws, message) => {
//   const { userID, category, name, extension, file: { mimetype, buffer } = {} } = message

//   if (!buffer) return ws.json({ error: 'No file' })

//   try {
//     const {
//       ops: [newFile],
//     } = await files.insertOne(
//       {
//         userID: ObjectID(userID),
//         category,
//         name,
//         extension,
//         mimetype,
//         buffer,
//         date: new Date(),
//       },
//       /*{ projection: { userID: 0, mimetype: 0, buffer: 0 } } has no effect */
//     )

//     delete newFile.userID
//     delete newFile.mimetype
//     delete newFile.buffer

//     ws.json({ newFile })
//   } catch (err) {
//     console.log(err)

//     ws.send()
//   }
// }

// export const downloadFile = async (ws, { userID, fileID }) => {
//   try {
//     const {
//       mimetype,
//       buffer: { buffer },
//     } = await files.findOne({ _id: ObjectID(fileID), userID: ObjectID(userID) })

//     res.header('Content-Type', mimetype)
//     res.header('Content-Disposition', 'attachment')
//     res.send(buffer)
//   } catch (err) {
//     console.error(err)
//     res.sendStatus(500)
//   }
// }

export const deleteFile = async (ws, message) => {
  try {
    if (!validateDeleteFile(message)) throw Error('Invalid parameters')

    const { userID, fileID } = message

    await files.deleteOne({ _id: ObjectID(fileID), userID: ObjectID(userID) })

    ws.json({ status: 'SUCCESS' })
  } catch ({ message }) {
    ws.json({ status: 'FAIL', message })
  }
}
