import stringify from 'fast-json-stable-stringify'

import { corsHeaders } from './util.js'

export default (req, res) => {
  res.send = body => {
    res.writeHead(200, { ...res.headers, ...corsHeaders(req.headers.origin) }).end(body)
  }

  res.json = body => {
    res
      .writeHead(200, { ...res.headers, ...corsHeaders(req.headers.origin), 'Content-Type': 'application/json' })
      .end(JSON.stringify(body))
  }

  res.redirect = url => {
    res.writeHead(303, { 'Set-Cookie': 'Bearer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT', Location: url })
  }
}
