import stringify from 'fast-json-stable-stringify'

import { corsHeaders } from './util.js'

const CLEAR_COOKIE = 'Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'

export const patchRequest = async req => {
  await new Promise(resolve => {
    let payload = ''

    req.on('data', chunk => {
      payload += chunk.toString()
    })

    req.on('end', () => {
      const { 'content-type': contentType } = req.headers

      if (contentType) {
        try {
          req.body = contentType.includes('application/json') ? JSON.parse(payload || '{}') : payload
        } catch ({ message }) {
          console.error(`Error: ${message}`)
        }
      }

      resolve()
    })
  })
}

export const patchResponse = (req, res) => {
  res.headers = {}

  res.status = code => {
    res.statusCode = code

    return res
  }

  res.sendStatus = code => {
    res.status(code).send()
  }

  res.send = body => {
    res.writeHead(res.statusCode || 200, { ...res.headers, ...corsHeaders(req.headers.origin) }).end(body)
  }

  res.json = body => {
    res
      .writeHead(res.statusCode || 200, {
        ...res.headers,
        ...corsHeaders(req.headers.origin),
        'Content-Type': 'application/json',
      })
      .end(stringify(body))
  }

  res.redirect = (url, { clearCookie } = {}) => {
    res.headers.Location = url

    if (clearCookie) res.headers['Set-Cookie'] = CLEAR_COOKIE

    res.send()
  }
}
