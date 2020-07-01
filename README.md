# Flying Notes Node.js Server

## Environment Variables

A `.env` file (https://www.npmjs.com/package/dotenv) should be placed at the root directory which will specify the following variables:

`MONGODB_URI` (required)

`ACCESS_TOKEN_SECRET` (required)

`ACCESS_TOKEN_EXPIRES_IN` (optional, default: 10 minutes)

`REFRESH_TOKEN_EXPIRES_IN_MONTHS` (optional, default: 3)

`PORT` (optional, default: 5000)

`CLIENT_URL` (required, default: localhost:3000)

`HEROKUAPP_URL` - to prevent Heroku app from sleeping [depends on dynos] - (optional)

## Available Scripts

### `npm start`

Starts the server.

### `npm run dev`

Starts the server while listening to changes (`nodemon`).

### `npm test`

Performs server tests.
