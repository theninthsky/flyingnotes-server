export const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

export const parseBody = req => {
  return new Promise(resolve => {
    let payload = ''

    req.on('data', chunk => {
      payload += chunk.toString()
    })

    req.on('end', () => {
      req.body = req.headers['content-type'].includes('application/json') ? JSON.parse(payload || '{}') : payload

      resolve()
    })
  })
}
