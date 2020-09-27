import schemaSafe from '@exodus/schemasafe'

const { validator } = schemaSafe
const options = { isJSON: true, unmodifiedPrototypes: true }

const noteSchema = {
  type: 'object',
  properties: {
    category: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'string' },
    date: { type: 'integer' },
  },
  required: ['content'],
}

export const validateCreateNote = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      newNote: { type: 'object' },
    },
    required: ['userID', 'newNote'],
  },
  options,
)

export const validateUpdateNote = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      updatedNote: { type: 'object' },
    },
    required: ['userID', 'updatedNote'],
  },
  options,
)

export const validateDeleteNote = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      noteID: { type: 'string' },
    },
    required: ['userID', 'noteID'],
  },
  options,
)
