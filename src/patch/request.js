export const patchRequest = req => {
  req.url = req.getUrl()
  req.method = req.getMethod()
  req.headers = {}
  req.forEach(header => (req.headers[header] = req.getHeader(header)))
}

export const patchBody = (req, res) => {
  return new Promise(resolve => {
    const { 'content-type': contentType = '' } = req.headers

    let buffer

    res.onData((chunk, isLast) => {
      const curBuf = Buffer.from(chunk)

      buffer = buffer ? Buffer.concat([buffer, curBuf]) : isLast ? curBuf : Buffer.concat([curBuf])

      if (isLast) {
        const payload = buffer.toString()

        try {
          req.body = contentType.includes('application/json') ? JSON.parse(payload) : payload
        } catch (err) {
          req.body = {}
        }

        resolve()
      }
    })
  })
}
