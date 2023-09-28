// import the mongoose package
const mongoose = require('mongoose');

// create a schema for the user model
const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    score: {
        type: Number,
        default: 0
    }   
});

// create a model from the schema
const User = mongoose.model('User', userSchema);

// export the model
module.exports = User;
