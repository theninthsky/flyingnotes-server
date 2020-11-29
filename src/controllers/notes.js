import mongodb from 'mongodb'

import { users } from '../database.js'
import { validateUserID } from '../models/user.js'
import { validateCreateNote, validateUpdateNote, validateDeleteNote } from '../models/note.js'

const { ObjectID } = mongodb

export const getNotes = async (ws, message) => {
  try {
    if (!validateUserID(message)) throw Error('Invalid parameters')

    const { messageID, userID } = message

    const { notes } = await users.findOne({ _id: ObjectID(userID) }, { projection: { notes: 1 } })

    ws.json({ messageID, notes })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const createNote = async (ws, message) => {
  try {
    if (!validateCreateNote(message)) throw Error('Invalid parameters')

    const {
      messageID,
      userID,
      newNote: { category = '', title, content }
    } = message

    const {
      value: {
        notes: [newNote]
      }
    } = await users.findOneAndUpdate(
      { _id: ObjectID(userID) },
      {
        $push: {
          notes: {
            _id: ObjectID(),
            category,
            title,
            content,
            date: new Date()
          }
        }
      },
      { projection: { notes: { $slice: -1 } }, returnOriginal: false }
    )

    ws.json({ messageID, newNote })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const updateNote = async (ws, message) => {
  try {
    if (!validateUpdateNote(message)) throw Error('Invalid parameters')

    const {
      messageID,
      userID,
      updatedNote: { _id: noteID, category = '', title, content }
    } = message

    const {
      value: {
        notes: [updatedNote]
      }
    } = await users.findOneAndUpdate(
      { _id: ObjectID(userID), 'notes._id': ObjectID(noteID) },
      {
        $set: {
          'notes.$': {
            _id: ObjectID(noteID),
            category,
            title,
            content,
            date: new Date()
          }
        }
      },
      { projection: { notes: { $elemMatch: { _id: ObjectID(noteID) } } }, returnOriginal: false }
    )

    ws.json({ messageID, updatedNote })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const deleteNote = async (ws, message) => {
  try {
    if (!validateDeleteNote(message)) throw Error('Invalid parameters')

    const { messageID, userID, noteID } = message

    await users.updateOne({ _id: ObjectID(userID) }, { $pull: { notes: { _id: ObjectID(noteID) } } })

    ws.json({ messageID, status: 'SUCCESS', noteID })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}
