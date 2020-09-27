import schemaSafe from '@exodus/schemasafe'

export default schemaSafe.validator({
  type: 'object',
  properties: {
    category: { type: 'string' },
    name: { type: 'string' },
    extension: { type: 'string' },
    mimetype: { type: 'string' },
    buffer: { type: 'object' },
  },
})
