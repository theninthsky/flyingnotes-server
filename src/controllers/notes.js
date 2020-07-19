import User from '../models/User.js'
import File from '../models/File.js'

export const getNotes = async (req, res) => {
  try {
    const user = await User.findById(req.userID)

    if (user) {
      res.json({ notes: user.notes })
    } else {
      res.status(401).send('Session expired')
    }
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const createNote = async (req, res) => {
  const { file } = req

  try {
    const user = await User.findById(req.userID)

    if (user) {
      user.notes.push({
        ...req.body,
        fileName: file && file.originalname,
        date: Date.now(),
      })
      const { notes } = await user.save()

      if (file) {
        const { mimetype, buffer } = file

        await new File({
          noteID: notes[notes.length - 1]._id,
          mimetype,
          buffer,
        }).save()
      }

      res.status(201).json({ newNote: notes[notes.length - 1] })
    }
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const updateNote = async (req, res) => {
  const { file } = req

  try {
    const user = await User.findById(req.userID)

    if (user) {
      user.notes = user.notes.map(note =>
        note._id == req.body._id
          ? {
              ...req.body,
              fileName: file ? file.originalname : note.fileName,
              date: Date.now(),
            }
          : note,
      )
      const { notes } = await user.save()

      if (file) {
        const { mimetype, buffer } = file

        await File.findOneAndUpdate({ noteID: req.body._id }, { mimetype, buffer }).then(file => {
          if (!file) {
            new File({ noteID: req.body._id, mimetype, buffer }).save()
          }
        })
      }

      res.json({ updatedNote: notes.find(note => note._id == req.body._id) })
    }
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}

export const deleteNote = async (req, res) => {
  const { noteID } = req.body

  try {
    const user = await User.findById(req.userID)

    if (user) {
      if (user.notes.find(note => note._id == noteID)) {
        user.notes = user.notes.filter(note => note._id != noteID)
        user.save().then(() => res.sendStatus(204))

        File.findOneAndDelete({ noteID }).then(() => {})
      } else {
        res.sendStatus(404)
      }
    }
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
    res.redirect('/')
  }
}
