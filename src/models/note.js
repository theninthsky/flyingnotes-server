import AJV from 'ajv'

const ajv = new AJV.default({ allErrors: true })

const noteSchema = {
  type: 'object',
  properties: {
    pinned: { type: 'boolean' },
    category: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'string' }
  },
  required: ['pinned', 'content']
}

export const validateCreateNote = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    newNote: noteSchema
  },
  required: ['userID', 'newNote']
})

export const validateUpdatePin = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    noteID: { type: 'string' },
    pinned: { type: 'boolean' }
  },
  required: ['userID', 'noteID', 'pinned']
})

export const validateUpdateNote = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    updatedNote: noteSchema
  },
  required: ['userID', 'updatedNote']
})

export const validateDeleteNote = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    noteID: { type: 'string' }
  },
  required: ['userID', 'noteID']
})
