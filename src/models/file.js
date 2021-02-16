import AJV from 'ajv'

const ajv = new AJV.default({ allErrors: true })

const fileSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    extension: { type: 'string' },
    base64: { type: 'string' }
  },
  required: ['name', 'extension', 'base64']
}

export const validateUploadFile = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    file: fileSchema
  },
  required: ['userID', 'file']
})

export const validateDownloadFile = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    fileID: { type: 'string' }
  },
  required: ['userID', 'fileID']
})

export const validateDeleteFile = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    fileID: { type: 'string' }
  },
  required: ['userID', 'fileID']
})
