import stringify from 'fast-json-stable-stringify'

export const patchWebSocket = (ws, messageID) => {
  ws.json = message => {
    ws.send(stringify({ messageID, ...message }))
  }
}
