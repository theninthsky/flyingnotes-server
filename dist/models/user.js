import AJV from 'ajv';
import addFormats from 'ajv-formats';
const ajv = new AJV.default({ allErrors: true });
addFormats(ajv);
export const validateRegister = ajv.compile({
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        notes: { type: 'array' }
    },
    required: ['name', 'email', 'password']
});
export const validateLogin = ajv.compile({
    type: 'object',
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 }
    },
    required: ['email', 'password']
});
export const validateUpdateUser = ajv.compile({
    type: 'object',
    properties: {
        userID: { type: 'string' },
        newName: { type: 'string' }
    },
    required: ['userID', 'newName']
});
export const validateChangePassword = ajv.compile({
    type: 'object',
    properties: {
        password: { type: 'string', minLength: 8 },
        newPassword: { type: 'string', minLength: 8 }
    },
    required: ['password', 'newPassword']
});
export const validateUserID = ajv.compile({
    type: 'object',
    properties: {
        userID: { type: 'string' }
    },
    required: ['userID']
});
