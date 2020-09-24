import stringify from 'fast-json-stable-stringify'

import { corsHeaders } from '../util.js'

const isProduction = process.env.NODE_ENV == 'production'

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
