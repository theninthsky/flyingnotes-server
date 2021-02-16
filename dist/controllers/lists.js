import mongodb from 'mongodb';
import { users } from '../database.js';
import { validateUserID } from '../models/user.js';
import { validateCreateList, validateUpdatePin, validateCheckItem, validateUpdateList, validateDeleteList } from '../models/list.js';
const { ObjectID } = mongodb;
export const getLists = async (ws, message) => {
    const { messageID, userID } = message;
    try {
        if (!validateUserID(message))
            throw Error('Invalid parameters');
        const { lists = [] } = await users.findOne({ _id: ObjectID(userID) }, { projection: { lists: 1 } });
        ws.json({ messageID, lists });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const createList = async (ws, message) => {
    const { messageID, userID, newList: { pinned, title, items } } = message;
    try {
        if (!validateCreateList(message))
            throw Error('Invalid parameters');
        const { value: { lists: [newList] } } = await users.findOneAndUpdate({ _id: ObjectID(userID) }, {
            $push: {
                lists: {
                    _id: ObjectID(),
                    pinned,
                    title,
                    items,
                    date: new Date()
                }
            }
        }, { projection: { lists: { $slice: -1 } }, returnOriginal: false });
        ws.json({ messageID, newList });
    }
    catch (message) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const updatePin = async (ws, message) => {
    const { messageID, userID, listID, pinned } = message;
    try {
        if (!validateUpdatePin(message))
            throw Error('Invalid parameters');
        await users.findOneAndUpdate({ _id: ObjectID(userID), 'lists._id': ObjectID(listID) }, {
            $set: {
                'lists.$.pinned': pinned
            }
        });
        ws.json({ messageID, status: 'SUCCESS' });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const checkItem = async (ws, message) => {
    const { messageID, userID, listID, index, item: { value, checked } } = message;
    try {
        if (!validateCheckItem(message))
            throw Error('Invalid parameters');
        await users.findOneAndUpdate({ _id: ObjectID(userID), 'lists._id': ObjectID(listID) }, {
            $unset: {
                [`lists.$.items.${index}`]: 1
            }
        });
        await users.findOneAndUpdate({ _id: ObjectID(userID), 'lists._id': ObjectID(listID) }, {
            $pull: {
                'lists.$.items': null
            }
        });
        if (checked) {
            await users.findOneAndUpdate({ _id: ObjectID(userID), 'lists._id': ObjectID(listID) }, {
                $push: {
                    'lists.$.items': { $each: [{ value, checked: !checked }], $position: 0 }
                }
            });
        }
        else {
            await users.findOneAndUpdate({ _id: ObjectID(userID), 'lists._id': ObjectID(listID) }, {
                $push: {
                    'lists.$.items': { value, checked: !checked }
                }
            });
        }
        ws.json({ messageID, status: 'SUCCESS' });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const updateList = async (ws, message) => {
    const { messageID, userID, updatedList: { _id: listID, pinned, title, items } } = message;
    try {
        if (!validateUpdateList(message))
            throw Error('Invalid parameters');
        const { value: { lists: [updatedList] } } = await users.findOneAndUpdate({ _id: ObjectID(userID), 'lists._id': ObjectID(listID) }, {
            $set: {
                'lists.$': {
                    _id: ObjectID(listID),
                    pinned,
                    title,
                    items,
                    date: new Date()
                }
            }
        }, { projection: { lists: { $elemMatch: { _id: ObjectID(listID) } } }, returnOriginal: false });
        ws.json({ messageID, updatedList });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const deleteList = async (ws, message) => {
    const { messageID, userID, listID } = message;
    try {
        if (!validateDeleteList(message))
            throw Error('Invalid parameters');
        await users.updateOne({ _id: ObjectID(userID) }, { $pull: { lists: { _id: ObjectID(listID) } } });
        ws.json({ messageID, status: 'SUCCESS', listID });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
