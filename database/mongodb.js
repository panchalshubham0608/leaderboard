// imports
const mongoose = require('mongoose');

// connect to local mongodb server
console.log('Connecting to MongoDB server...');
mongoose.connect('mongodb://localhost:27017/leaderboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB server');
}).catch((err) => {
    console.log("Failed to connecto to MongoDB server");
    console.error(err);
});
