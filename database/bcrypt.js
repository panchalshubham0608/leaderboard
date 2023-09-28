// imports
const bcrypt = require('bcryptjs');

// generate a salt
const salt = bcrypt.genSaltSync(10);

// hash a password
const hash = (plainText) => bcrypt.hashSync(plainText, salt);

// compare a password
const isMatch = (password, hash) => bcrypt.compareSync(password, hash);

// export the bcrypt module
module.exports = {
    hash,
    isMatch
};

