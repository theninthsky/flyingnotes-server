import mongodb from 'mongodb'

import { files } from '../database.js'

const { ObjectID } = mongodb

export const getFiles = async (ws, { userID }) => {
  try {
    const allFiles = await files
      .find({ userID: ObjectID(userID) }, { projection: { userID: 0, mimetype: 0, buffer: 0 } })
      .toArray()

    ws.json({ files: allFiles })
  } catch (err) {
    console.error(err)

    ws.send()
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

export const deleteFile = async (ws, { userID, fileID }) => {
  try {
    await files.deleteOne({ _id: ObjectID(fileID), userID: ObjectID(userID) })

    ws.json({ status: 'OK' })
  } catch (err) {
    console.log(err)

    ws.json({ status: 'FAIL' })
  }
}
