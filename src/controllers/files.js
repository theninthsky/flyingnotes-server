import mongodb from 'mongodb'

import { files } from '../database.js'

const { ObjectID } = mongodb

export const getFiles = async (req, res) => {
  try {
    const allFiles = await files
      .find({ userID: ObjectID(req.userID) }, { projection: { userID: 0, mimetype: 0, buffer: 0 } })
      .toArray()

    res.json({ files: allFiles })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export const uploadFile = async (req, res) => {
  const {
    userID,
    body: { category, name, extension },
    file: { mimetype, buffer } = {},
  } = req

  if (!buffer) return res.sendStatus(404)

  try {
    const [newFile] = (
      await files.insertOne(
        {
          userID: ObjectID(userID),
          category,
          name,
          extension,
          mimetype,
          buffer,
          date: new Date(),
        },
        /*{ projection: { userID: 0, mimetype: 0, buffer: 0 } } has no effect */
      )
    ).ops

    delete newFile.userID
    delete newFile.mimetype
    delete newFile.buffer

    res.status(201).json({ newFile })
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
}

export const downloadFile = async (req, res) => {
  try {
    const {
      mimetype,
      buffer: { buffer },
    } = await files.findOne({ _id: ObjectID(req.body.fileID), userID: ObjectID(req.userID) })

    res.setHeader('Content-Type', mimetype)
    res.setHeader('Content-Disposition', 'attachment')
    res.send(buffer)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export const deleteFile = async (req, res) => {
  try {
    await files.deleteOne({ _id: ObjectID(req.body.fileID), userID: ObjectID(req.userID) })

    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
}
