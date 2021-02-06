import mongodb from 'mongodb'

import { users } from '../database.js'
import { validateUserID } from '../models/user.js'

const { ObjectID } = mongodb

export const getLists = async (ws, message) => {
  const { messageID, userID } = message

  try {
    if (!validateUserID(message)) throw Error('Invalid parameters')

    const { lists = [] } = await users.findOne({ _id: ObjectID(userID) }, { projection: { lists: 1 } })

    ws.json({ messageID, lists })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const createList = async (ws, message) => {
  const {
    messageID,
    userID,
    newList: { pinned, title, items }
  } = message

  try {
    const {
      value: {
        lists: [newList]
      }
    } = await users.findOneAndUpdate(
      { _id: ObjectID(userID) },
      {
        $push: {
          lists: {
            _id: ObjectID(),
            pinned,
            title,
            items,
            date: new Date()
          }
        }
      },
      { projection: { lists: { $slice: -1 } }, returnOriginal: false }
    )

    ws.json({ messageID, newList })
  } catch (message) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const updateList = async (ws, message) => {
  const {
    messageID,
    userID,
    updatedList: { _id: listID, pinned, title, items }
  } = message

  try {
    const {
      value: {
        lists: [updatedList]
      }
    } = await users.findOneAndUpdate(
      { _id: ObjectID(userID), 'lists._id': ObjectID(listID) },
      {
        $set: {
          'lists.$': {
            _id: ObjectID(listID),
            pinned,
            title,
            items,
            date: new Date()
          }
        }
      },
      { projection: { lists: { $elemMatch: { _id: ObjectID(listID) } } }, returnOriginal: false }
    )

    ws.json({ messageID, updatedList })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}

export const deleteList = async (ws, message) => {
  const { messageID, userID, listID } = message

  try {
    await users.updateOne({ _id: ObjectID(userID) }, { $pull: { lists: { _id: ObjectID(listID) } } })

    ws.json({ messageID, status: 'SUCCESS', listID })
  } catch ({ message }) {
    ws.json({ messageID, status: 'FAIL', message })
  }
}
