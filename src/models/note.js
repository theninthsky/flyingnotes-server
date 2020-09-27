import schemaSafe from '@exodus/schemasafe'

export default schemaSafe.validator({
  type: 'object',
  properties: {
    category: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'string' },
    date: { type: 'integer' },
  },
  required: ['content'],
})
