import stringify from 'fast-json-stable-stringify'

export const patchWebSocket = ws => {
  ws.json = message => {
    ws.send(stringify(message))
  }
}
