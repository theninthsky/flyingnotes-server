import schemaSafe from '@exodus/schemasafe'

const { validator } = schemaSafe
const options = { isJSON: true, unmodifiedPrototypes: true }

export const validateRegisterSchema = validator(
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      notes: { type: 'array' },
    },
    required: ['name', 'email', 'password'],
  },
  options,
)

export const validateLoginSchema = validator(
  {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
    required: ['email', 'password'],
  },
  options,
)

export const validateUpdateUserSchema = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      newName: { type: 'string' },
    },
    required: ['userID', 'newName'],
  },
  options,
)

export const validateChangePasswordSchema = validator(
  {
    type: 'object',
    properties: {
      userID: { type: 'string' },
      password: { type: 'string', minLength: 8 },
      newPassword: { type: 'string', minLength: 8 },
    },
    required: ['userID', 'password', 'newPassword'],
  },
  options,
)
