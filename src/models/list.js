import AJV from 'ajv'

const ajv = new AJV.default({ allErrors: true })

const itemSchema = {
  type: 'object',
  properties: {
    checked: { type: 'boolean' },
    value: { type: 'string' }
  },
  required: ['checked', 'value']
}

const listSchema = {
  type: 'object',
  properties: {
    pinned: { type: 'boolean' },
    title: { type: 'string' },
    items: { type: 'array', items: itemSchema }
  },
  required: ['pinned', 'items']
}

export const validateCreateList = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    newList: listSchema
  },
  required: ['userID', 'newList']
})

export const validateUpdatePin = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    listID: { type: 'string' },
    pinned: { type: 'boolean' }
  },
  required: ['userID', 'listID', 'pinned']
})

export const validateCheckItem = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    listID: { type: 'string' },
    index: { type: 'number' },
    item: itemSchema
  },
  required: ['userID', 'listID', 'index', 'item']
})

export const validateUpdateList = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    updatedList: listSchema
  },
  required: ['userID', 'updatedList']
})

export const validateDeleteList = ajv.compile({
  type: 'object',
  properties: {
    userID: { type: 'string' },
    listID: { type: 'string' }
  },
  required: ['userID', 'listID']
})
