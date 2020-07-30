import mongodb from 'mongodb'

import { users, files } from '../database.js'

const { ObjectID } = mongodb

export const getNotes = async (req, res) => {
  try {
    const { notes } = await users.findOne({ _id: ObjectID(req.userID) }, { projection: { notes: 1 } })

    res.json({ notes })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export const createNote = async (req, res) => {
  const {
    body: { color, category, title, content },
    file,
  } = req

  try {
    const [newNote] = (
      await users.findOneAndUpdate(
        { _id: ObjectID(req.userID) },
        {
          $push: {
            notes: {
              _id: ObjectID(),
              color,
              category,
              title,
              content,
              fileName: file && file.name,
              date: new Date(),
            },
          },
        },
        { projection: { notes: { $slice: -1 } }, returnOriginal: false },
      )
    ).value.notes

    if (file) {
      const { mimetype, buffer } = file

      await files.insertOne({
        noteID: newNote._id,
        mimetype,
        buffer,
      })
    }

    res.status(201).json({ newNote })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export const updateNote = async (req, res) => {
  const {
    userID,
    body: { _id: noteID, color, category, title, content },
    file,
  } = req

  try {
    const [updatedNote] = (
      await users.findOneAndUpdate(
        { _id: ObjectID(userID), 'notes._id': ObjectID(noteID) },
        {
          $set: {
            'notes.$': {
              _id: ObjectID(noteID),
              color,
              category,
              title,
              content,
              fileName: file && file.name,
              date: new Date(),
            },
          },
        },
        { projection: { notes: { $elemMatch: { _id: ObjectID(noteID) } } }, returnOriginal: false },
      )
    ).value.notes

    if (file) {
      const { mimetype, buffer } = file

      await files.findOneAndReplace(
        { noteID: ObjectID(noteID) },
        { noteID: ObjectID(updatedNote._id), mimetype, buffer },
        { upsert: true },
      )
    }

    res.json({ updatedNote })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export const deleteNote = async (req, res) => {
  const {
    userID,
    body: { noteID },
  } = req

  try {
    await Promise.all([
      users.updateOne({ _id: ObjectID(userID) }, { $pull: { notes: { _id: ObjectID(noteID) } } }),
      files.deleteOne({ noteID: ObjectID(noteID) }),
    ])

    res.sendStatus(204)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}
