import { register, login, renewToken, updateUser, changePassword, logout } from './users.js'
import { getNotes, createNote, updateNotePin, updateNote, deleteNote } from './notes.js'
import { getLists, createList, updateListPin, checkItem, updateList, deleteList } from './lists.js'
import { getFiles, uploadFile, downloadFile, deleteFile } from './files.js'

export const restControllers = {
  GET: {
    '/renew-token': renewToken
  },
  POST: {
    '/register': register,
    '/login': login,
    '/logout': logout
  },
  PUT: {
    '/change-password': changePassword
  }
}

export const wsControllers = {
  updateUser,
  getNotes,
  createNote,
  updateNotePin,
  updateNote,
  deleteNote,
  getLists,
  createList,
  updateListPin,
  checkItem,
  updateList,
  deleteList,
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile
}
