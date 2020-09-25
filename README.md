# Flying Notes Node.js Server

## Environment Variables

A `.env` file (https://www.npmjs.com/package/dotenv) should be placed at the root directory which will specify the following variables:

`ACCESS_TOKEN_EXPIRES_IN` (optional, default: 10 minutes)

`ACCESS_TOKEN_SECRET` (required)

`BCRYPT_SALT_ROUNDS` (optional, default: 10)

`CLIENT_URL` (required, default: localhost:3000)

`HEROKUAPP_URL` - to prevent Heroku app from sleeping [depends on dynos] - (optional)

`MONGODB_URI` (required)

`PORT` (optional, default: 5000)

`REFRESH_TOKEN_EXPIRES_IN_MONTHS` (optional, default: 3)

## Available Scripts

### `npm start`

Starts the server.

### `npm run dev`

Starts the server while listening to changes (`nodemon`).

### `npm test`

Performs server tests.
