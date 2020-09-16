import mongodb from 'mongodb'

import { users } from '../database.js'

const { ObjectID } = mongodb

export const getNotes = async (ws, body) => {
  try {
    const { notes } = await users.findOne({ _id: ObjectID(body.userID) }, { projection: { notes: 1 } })

    ws.send(JSON.stringify({ notes }))
  } catch (err) {
    console.error(err)

    ws.send()
  }
}

export const createNote = async (req, res) => {
  const {
    body: { category, title, content },
  } = req

  try {
    const {
      value: {
        notes: [newNote],
      },
    } = await users.findOneAndUpdate(
      { _id: ObjectID(req.userID) },
      {
        $push: {
          notes: {
            _id: ObjectID(),
            category,
            title,
            content,
            date: new Date(),
          },
        },
      },
      { projection: { notes: { $slice: -1 } }, returnOriginal: false },
    )

    res.status(201).json({ newNote })
  } catch (err) {
    console.error(err)

    res.sendStatus(500)
  }
}

export const updateNote = async (req, res) => {
  const {
    userID,
    body: { _id: noteID, category, title, content },
  } = req

  try {
    const {
      value: {
        notes: [updatedNote],
      },
    } = await users.findOneAndUpdate(
      { _id: ObjectID(userID), 'notes._id': ObjectID(noteID) },
      {
        $set: {
          'notes.$': {
            _id: ObjectID(noteID),
            category,
            title,
            content,
            date: new Date(),
          },
        },
      },
      { projection: { notes: { $elemMatch: { _id: ObjectID(noteID) } } }, returnOriginal: false },
    )

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
    await users.updateOne({ _id: ObjectID(userID) }, { $pull: { notes: { _id: ObjectID(noteID) } } })

    res.sendStatus(204)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}
