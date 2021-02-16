import mongodb from 'mongodb';
import { users } from '../database.js';
import { validateUserID } from '../models/user.js';
import { validateCreateNote, validateUpdatePin, validateUpdateNote, validateDeleteNote } from '../models/note.js';
const { ObjectID } = mongodb;
export const getNotes = async (ws, message) => {
    const { messageID, userID } = message;
    try {
        if (!validateUserID(message))
            throw Error('Invalid parameters');
        const { notes = [] } = await users.findOne({ _id: ObjectID(userID) }, { projection: { notes: 1 } });
        ws.json({ messageID, notes });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const createNote = async (ws, message) => {
    const { messageID, userID, newNote: { pinned, category = '', title, content } } = message;
    try {
        if (!validateCreateNote(message))
            throw Error('Invalid parameters');
        const { value: { notes: [newNote] } } = await users.findOneAndUpdate({ _id: ObjectID(userID) }, {
            $push: {
                notes: {
                    _id: ObjectID(),
                    pinned,
                    category,
                    title,
                    content,
                    date: new Date()
                }
            }
        }, { projection: { notes: { $slice: -1 } }, returnOriginal: false });
        ws.json({ messageID, newNote });
    }
    catch (message) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const updatePin = async (ws, message) => {
    const { messageID, userID, noteID, pinned } = message;
    try {
        if (!validateUpdatePin(message))
            throw Error('Invalid parameters');
        await users.findOneAndUpdate({ _id: ObjectID(userID), 'notes._id': ObjectID(noteID) }, {
            $set: {
                'notes.$.pinned': pinned
            }
        });
        ws.json({ messageID, status: 'SUCCESS' });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const updateNote = async (ws, message) => {
    const { messageID, userID, updatedNote: { _id: noteID, pinned, category = '', title, content } } = message;
    try {
        if (!validateUpdateNote(message))
            throw Error('Invalid parameters');
        const { value: { notes: [updatedNote] } } = await users.findOneAndUpdate({ _id: ObjectID(userID), 'notes._id': ObjectID(noteID) }, {
            $set: {
                'notes.$': {
                    _id: ObjectID(noteID),
                    pinned,
                    category,
                    title,
                    content,
                    date: new Date()
                }
            }
        }, { projection: { notes: { $elemMatch: { _id: ObjectID(noteID) } } }, returnOriginal: false });
        ws.json({ messageID, updatedNote });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const deleteNote = async (ws, message) => {
    const { messageID, userID, noteID } = message;
    try {
        if (!validateDeleteNote(message))
            throw Error('Invalid parameters');
        await users.updateOne({ _id: ObjectID(userID) }, { $pull: { notes: { _id: ObjectID(noteID) } } });
        ws.json({ messageID, status: 'SUCCESS', noteID });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
