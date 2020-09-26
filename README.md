# Flying Notes Node.js Server

## Environment Variables

`ACCESS_TOKEN_EXPIRES_IN` (optional, default: 10 minutes)

`ACCESS_TOKEN_SECRET` (required)

`BCRYPT_SALT_ROUNDS` (optional, default: 10)

`CLIENT_URL` (required, default: localhost:3000)

`HEROKUAPP_URL` (optional) - To prevent Heroku app from sleeping [depends on dynos]

`MONGODB_URI` (required)

`PING_INTERVAL` (optional, default: 30000) - The interval for the WebSocket's ping message

`PORT` (optional, default: 5000)

`REFRESH_TOKEN_EXPIRES_IN_MONTHS` (optional, default: 3)

## Available Scripts

### `npm start`

Starts the server.

### `npm run dev`

Starts the server while listening to changes (`nodemon`).

### `npm test`

Performs server tests.
