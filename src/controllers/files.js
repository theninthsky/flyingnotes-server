import mongodb from 'mongodb'

import { files } from '../database.js'

const { ObjectID } = mongodb

export const getFile = async (req, res) => {
  try {
    const {
      mimetype,
      buffer: { buffer },
    } = await files.findOne({ noteID: ObjectID(req.body.noteID) })

    res.setHeader('Content-Type', mimetype)
    res.setHeader('Content-Disposition', 'attachment')
    res.send(buffer)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}
