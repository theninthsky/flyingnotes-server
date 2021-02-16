import https from 'https';
import { connect } from './database.js';
const { PORT = 5000, SERVER_URL = 'https://localhost:5000' } = process.env;
try {
    await connect();
}
catch (err) {
    console.error(err);
    process.exit(1);
}
const { default: app } = await import('./app.js');
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
setInterval(() => https.get(SERVER_URL), 900000); // keep Heroku app awake
process.on('uncaughtException', err => console.error(err.message || err));
