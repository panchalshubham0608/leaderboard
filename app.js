// imports
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const leaderboardRouter = require('./routes/leaderboard');
const usersRouter = require('./routes/users');
require('./database/mongodb');
require('./database/redis');

// configure the app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url} `);
    next();
});

// use the leaderboard router
app.use('/leaderboard', leaderboardRouter);

// use the users router
app.use('/users', usersRouter);

// health check endpoint
app.head('/health', (req, res) => {
    res.status(200).send('OK');
});

// get port number from command line arguments
const port = process.argv[2];
if (!port) {
    console.error('Please specify the port number');
    process.exit(1);
}

// start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
