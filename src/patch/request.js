export const patchRequest = async req => {
  await new Promise(resolve => {
    const { 'content-type': contentType = '' } = req.headers

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
  })
}
