import stringify from 'fast-json-stable-stringify'

import { corsHeaders } from '../util.js'

const isProduction = process.env.NODE_ENV == 'production'

export const patchResponse = res => {
  res.status = code => {
    res.statusCode = code

    return res
  }

  res.sendStatus = code => {
    res.status(code).send()
  }

  res.json = body => {
    res.setHeader('Content-Type', 'application/json')
    res.send(stringify(body))
  }

  res.send = body => {
    const headers = { ...res.headers, ...corsHeaders }

    for (const header in headers) res.setHeader(header, headers[header])

    res.end(body)
  }

  res.redirect = (url, { clearCookie } = {}) => {
    res.setHeader('Location', url)

    if (clearCookie)
      res.setHeader(
        'Set-Cookie',
        `Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=None${
          isProduction ? '; Secure' : ''
        }`
      )

    res.send()
  }
}
