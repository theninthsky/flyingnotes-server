import { readFileSync } from 'fs'
import formidable from 'formidable'
import stringify from 'fast-json-stable-stringify'

import { corsHeaders } from './util.js'

const CLEAR_COOKIE = 'Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'

export const patchRequest = async req => {
  await new Promise(resolve => {
    const { 'content-type': contentType = '' } = req.headers

    if (contentType.includes('multipart/form-data')) {
      formidable({ maxFileSize: 10 * 1024 * 1024 }).parse(req, (err, fields, { file }) => {
        if (err) return (req.body = {})

        req.body = fields

        if (file) {
          const { name, type, path } = file

          req.file = { name, mimetype: type, buffer: readFileSync(path) }
        }

        resolve()
      })
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
