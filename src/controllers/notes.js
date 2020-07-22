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
  const {
    file,
    body: { color, category, title, content },
  } = req

  try {
    const user = await User.findById(req.userID)

    if (user) {
      user.notes.push({
        color,
        category,
        title,
        content,
        fileName: file && file.name,
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
  const {
    file,
    body: { _id: noteID, color, category, title, content },
  } = req

  try {
    const user = await User.findById(req.userID)

    if (user) {
      user.notes = user.notes.map(note =>
        note._id == noteID
          ? {
              _id: noteID,
              color,
              category,
              title,
              content,
              fileName: file ? file.name : note.fileName,
              date: Date.now(),
            }
          : note,
      )

      const { notes } = await user.save()

      if (file) {
        const { mimetype, buffer } = file
        const options = { upsert: true, setDefaultsOnInsert: true }

        await File.findOneAndUpdate({ noteID }, { mimetype, buffer }, options)
      }

      res.json({ updatedNote: notes.find(({ _id }) => _id == noteID) })
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
      if (user.notes.find(({ _id }) => _id == noteID)) {
        user.notes = user.notes.filter(({ _id }) => _id != noteID)

        await user.save()

        res.sendStatus(204)

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
