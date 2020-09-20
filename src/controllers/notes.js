import mongodb from 'mongodb'

import { users } from '../database.js'

const { ObjectID } = mongodb

export const getNotes = async (ws, { userID }) => {
  try {
    const { notes } = await users.findOne({ _id: ObjectID(userID) }, { projection: { notes: 1 } })

    ws.json({ notes })
  } catch (err) {
    console.error(err)

    ws.send()
  }
}

export const addNote = async (ws, { userID, category = '', title, content }) => {
  try {
    const {
      value: {
        notes: [newNote],
      },
    } = await users.findOneAndUpdate(
      { _id: ObjectID(userID) },
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

    ws.json({ newNote })
  } catch (err) {
    console.error(err)

    ws.send()
  }
}

export const updateNote = async (ws, { userID, noteID, category = '', title, content }) => {
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

    ws.json({ updatedNote })
  } catch (err) {
    console.error(err)

    ws.send()
  }
}

export const deleteNote = async (ws, { userID, noteID }) => {
  try {
    await users.updateOne({ _id: ObjectID(userID) }, { $pull: { notes: { _id: ObjectID(noteID) } } })

    ws.json({ status: 'OK' })
  } catch (err) {
    console.error(err)

    ws.json({ status: 'FAIL' })
  }
}
