import stringify from 'fast-json-stable-stringify'

export const patchWebsocket = (ws, { type }) => {
  ws.json = message => ws.send(stringify({ type, ...message }))
}
