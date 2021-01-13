import schemaSafe from '@exodus/schemasafe'

const { validator } = schemaSafe
const options = { isJSON: true, unmodifiedPrototypes: true }

export const validateRegister = validator(
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      notes: { type: 'array' }
    },
    required: ['name', 'email', 'password']
  },
  options
)

export const validateLogin = validator(
  {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    },
    required: ['email', 'password']
  },
  options
)

export const validateUpdateUser = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      newName: { type: 'string' }
    },
    required: ['userID', 'newName']
  },
  options
)

export const validateChangePassword = validator(
  {
    type: 'object',
    properties: {
      password: { type: 'string', minLength: 8 },
      newPassword: { type: 'string', minLength: 8 }
    },
    required: ['password', 'newPassword']
  },
  options
)

export const validateUserID = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' }
    },
    required: ['userID']
  },
  options
)
