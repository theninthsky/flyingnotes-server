const { CLIENT_URL = 'http://localhost:3000' } = process.env

export const redirectUser = () => {
  res
    .writeStatus(303)
    .writeHeader('Set-Cookie', 'Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    .writeHeader('Location', CLIENT_URL)
}

export const parseBody = res => {
  return new Promise(resolve => {
    let buffer

    res.onData((ab, isLast) => {
      const curBuf = Buffer.from(ab)

      buffer = buffer ? Buffer.concat([buffer, curBuf]) : isLast ? curBuf : Buffer.concat([curBuf])

      if (isLast) {
        try {
          resolve(JSON.parse(buffer))
        } catch (err) {
          resolve(null)
        }
      }
    })

    res.onAborted(() => {})
  })
}
