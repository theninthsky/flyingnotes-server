export const redirectUser = () => {
  res
    .writeStatus(303)
    .writeHeader('Set-Cookie', 'Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    .writeHeader('Location', CLIENT_URL)
}

export const readJson = res => {
  return new Promise((resolve, reject) => {
    let buffer
    /* Register data cb */
    res.onData((ab, isLast) => {
      let chunk = Buffer.from(ab)
      if (isLast) {
        let json
        if (buffer) {
          try {
            json = JSON.parse(Buffer.concat([buffer, chunk]))
          } catch (e) {
            /* res.close calls onAborted */
            res.close()
            return
          }
          resolve(json)
        } else {
          try {
            json = JSON.parse(chunk)
          } catch (e) {
            /* res.close calls onAborted */
            res.close()
            return
          }
          resolve(json)
        }
      } else {
        if (buffer) {
          buffer = Buffer.concat([buffer, chunk])
        } else {
          buffer = Buffer.concat([chunk])
        }
      }
    })
  })
}
