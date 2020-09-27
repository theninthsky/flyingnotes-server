import stringify from 'fast-json-stable-stringify'

export const patchWebSocket = (ws, { type }) => {
  ws.json = message => ws.send(stringify({ type, ...message }))
}
