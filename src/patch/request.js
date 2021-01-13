export const patchRequest = async req => {
  await new Promise(resolve => {
    const { 'content-type': contentType = '' } = req.headers

    if (contentType.includes('multipart/form-data')) {
      const busboy = new Busboy({ headers: req.headers })

      req.body = {}

      busboy.on('file', (fieldName, file, name, encoding, mimetype) => {
        const data = []

        file.on('data', chunk => data.push(chunk))
        file.on('end', () => (req.file = { mimetype, buffer: Buffer.concat(data) }))
      })

      busboy.on('field', (fieldName, val) => (req.body[fieldName] = val))
      busboy.on('finish', () => resolve())

      req.pipe(busboy)
    } else {
      let payload = ''

      req.on('data', chunk => {
        payload += chunk.toString()
      })

      req.on('end', () => {
        try {
          req.body = contentType.includes('application/json') ? JSON.parse(payload || '{}') : payload
        } catch ({ message }) {
          console.error(`Error: ${message}`)
        }

        resolve()
      })
    }
  })
}
