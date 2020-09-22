import stringify from 'fast-json-stable-stringify'

import { corsHeaders } from './util.js'

const isProduction = process.env.NODE_ENV == 'production'

export const patchRequest = req => {
  req.url = req.getUrl()
  req.method = req.getMethod()
  req.headers = {}
  req.forEach(header => (req.headers[header] = req.getHeader(header)))
}

export const patchResponse = res => {
  res.headers = {}

  res.header = (field, value) => (res.headers[field] = value)

  res.status = code => {
    res.statusCode = code

    return res
  }

  res.sendStatus = code => {
    res.status(code).send()
  }

  res.json = body => {
    res.header('Content-Type', 'application/json')
    res.send(stringify(body))
  }

  res.send = body => {
    res.writeStatus(`${res.statusCode || 200}`)

    const headers = { ...res.headers, ...corsHeaders }

    for (const header in headers) res.writeHeader(header, headers[header])

    res.cork(() => res.end(body))
  }

  res.redirect = (url, { clearCookie } = {}) => {
    res.header('Location', url)

    if (clearCookie)
      res.header(
        'Set-Cookie',
        `Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=None${
          isProduction ? '; Secure' : ''
        }`,
      )

    res.send()
  }
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

export const patchWebsocket = (ws, { type }) => {
  ws.json = message => ws.send(stringify({ type, ...message }))
}
