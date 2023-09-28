// imports
const jwt = require('jsonwebtoken');
// jwt does not store any information at its own
// it encodes everything into the token and thereby makes the server stateless
// because we do not store any session data.

// secret key for jwt
const JWT_SECRET = process.env.JWT_SECRET || 'jwtsecret';

// middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
    // get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized');
    }

    // get the token
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    // verify the token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).send('Unauthorized');
        }

        // set the user in the request object
        req.user = user;
        next();
    });
};

// function to generate a jwt token
const generateToken = (user) => {
    // generate a jwt token
    const token = jwt.sign(user, JWT_SECRET, {
        expiresIn: '1d'
    });

    // return the token
    return token;
};


// export the middleware
module.exports = {
    isLoggedIn,
    generateToken
};
