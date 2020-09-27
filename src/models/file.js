import schemaSafe from '@exodus/schemasafe'

const { validator } = schemaSafe
const options = { isJSON: true, unmodifiedPrototypes: true }

export const validateUploadFile = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      category: { type: 'string' },
      name: { type: 'string' },
      extension: { type: 'string' },
      mimetype: { type: 'string' },
      buffer: { type: 'object' },
    },
  },
  options,
)

export const validateDeleteFile = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      fileID: { type: 'string' },
    },
  },
  options,
)
