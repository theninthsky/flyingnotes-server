import File from '../models/File.js'

export const getFile = async (req, res) => {
  if (!req.userID) return res.status(404).send()

  try {
    const file = await File.findOne({ noteID: req.body.noteID })

    if (file) {
      const { mimetype, buffer } = file

      res.setHeader('Content-Type', mimetype)
      res.setHeader('Content-Disposition', 'attachment')
      res.send(buffer)
    }
  } catch ({ message, errmsg }) {
    console.error(`Error: ${message || errmsg}`)
  }
}
