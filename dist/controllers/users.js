import mongodb from 'mongodb';
import bcrypt from 'bcrypt';
import { users, tokens } from '../database.js';
import { validateRegister, validateLogin, validateUpdateUser, validateChangePassword } from '../models/user.js';
import { verifyToken, generateRefreshToken, touchRefreshToken, generateAccessToken } from '../util.js';
const { CLIENT_URL = 'http://localhost:3000', BCRYPT_SALT_ROUNDS = 10 } = process.env;
const { ObjectID } = mongodb;
export const register = async (req, res) => {
    if (!validateRegister(req.body))
        return res.sendStatus(400);
    try {
        const { name, email, password, notes = [], lists = [] } = req.body;
        notes.forEach(note => (note._id = ObjectID()));
        lists.forEach(list => (list._id = ObjectID()));
        const { ops: [user] } = await users.insertOne({ name, email, password: await bcrypt.hash(password, +BCRYPT_SALT_ROUNDS), notes, lists });
        console.log(`${user.name} registered`);
        const refreshTokenID = await generateRefreshToken(user._id);
        const token = generateAccessToken(res, user._id, refreshTokenID);
        res.status(201).json({ name: user.name, notes: user.notes, lists: user.lists, token });
    }
    catch {
        res.status(409).json({ err: 'This email address is already registered, try login instead' });
    }
};
export const login = async (req, res) => {
    if (!validateLogin(req.body))
        return res.sendStatus(400);
    try {
        const { email, password } = req.body;
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(404).json({ err: 'No such user exists' });
        const { _id: userID, password: hashedPassword, name, notes = [], lists = [] } = user;
        const match = await bcrypt.compare(password, hashedPassword);
        if (!match)
            return res.status(404).json({ err: 'Incorrect email or password' });
        const { _id: refreshTokenID = await generateRefreshToken(userID) } = (await tokens.findOne({ userID })) || {};
        const token = generateAccessToken(res, userID, refreshTokenID);
        touchRefreshToken(refreshTokenID);
        res.json({ name, notes, lists, token });
    }
    catch {
        res.sendStatus(500);
    }
};
export const renewToken = async (req, res) => {
    try {
        const { userID, refreshTokenID } = await verifyToken(req);
        generateAccessToken(res, userID, refreshTokenID);
        touchRefreshToken(refreshTokenID);
        res.json({ userID });
    }
    catch {
        res.status(401).redirect(CLIENT_URL, { clearCookie: true });
    }
};
export const updateUser = async (ws, message) => {
    const { messageID, userID, newName } = message;
    try {
        if (!validateUpdateUser(message))
            throw Error('Invalid parameters');
        await users.updateOne({ _id: ObjectID(userID) }, { $set: { name: newName } });
        ws.json({ messageID, status: 'SUCCESS', newName });
    }
    catch ({ message }) {
        ws.json({ messageID, status: 'FAIL', message });
    }
};
export const changePassword = async (req, res) => {
    const { password, newPassword } = req.body;
    try {
        const { userID } = await verifyToken(req);
        if (!validateChangePassword(req.body))
            throw Error('Invalid parameters');
        const user = await users.findOne({ _id: ObjectID(userID) });
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ error: 'Incorrect password' });
        await users.updateOne({ _id: ObjectID(userID) }, { $set: { password: await bcrypt.hash(newPassword, +BCRYPT_SALT_ROUNDS) } });
        tokens.deleteOne({ userID: ObjectID(userID) });
        const refreshTokenID = await generateRefreshToken(userID);
        generateAccessToken(res, userID, refreshTokenID);
        res.sendStatus(200);
    }
    catch ({ message }) {
        console.log(message);
        res.sendStatus(500);
    }
};
export const logout = (_, res) => res.status(204).redirect(CLIENT_URL, { clearCookie: true });
