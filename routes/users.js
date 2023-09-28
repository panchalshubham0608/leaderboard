// imports
const router = require('express').Router();
const { hash, isMatch } = require('../database/bcrypt');
const { isLoggedIn, generateToken } = require('../database/session');
const User = require('../database/model/User');
const redis = require('../database/redis');

// list all users
router.get('/', (req, res) => {
    User.find({}).then(users => {
        let usersList = [];
        users.forEach(user => {
            usersList.push({
                id: user._id,
                name: user.name,
                email: user.email,
                score: user.score
            });
        });
        return res.status(200).json({users: usersList});
    }).catch(err => {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    });
});

// to register a new user
router.post('/register', (req, res) => {
    // get properties from request body
    const { email, name, password } = req.body;

    // check if the properties exist
    if (!email || !name || !password) {
        return res.status(400).json({message: 'Bad Request'});
    }

    // create a new user
    const user = new User({ email, name, password: hash(password) });

    // save the user
    user.save().then((user) => {
        console.log(`User ${user.name} created with id ${user._id} in the database`);
        // add the user to redis
        redis.addUserToRedis({user_id: user._id, username: user.name}).then(() => {
            console.log(`User ${user.name} created with id ${user._id} in redis`);
            // add the score to redis
            redis.upsertScoreInRedis({user_id: user._id, score: user.score}).then(() => {
                console.log(`Score ${user.score} updated for user ${user.name} with id ${user._id} in redis`);
                return res.status(201).json({message: `User ${user.name} created with id ${user._id}`});
            }).catch((err) => {
                console.error(err);
                return res.status(500).json({message: 'Internal Server Error'});
            });
        }).catch((err) => {
            console.error(err);
            return res.status(500).json({message: 'Internal Server Error'});
        });
    }).catch((err) => {
        if (err.code === 11000) {
            return res.status(409).json({message: 'User already exists'});
        }
        return res.status(500).json({message: 'Internal Server Error'});
    });
});

// to login a user
router.post('/login', (req, res) => {
    // get properties from request body
    const { email, password } = req.body;

    // check if the properties exist
    if (!email || !password) {
        return res.status(400).json({message: 'Bad Request'});
    }

    // find the user
    User.findOne({ email }).then(user => {
        // check if the user exists
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        // check if the passwords match
        if (!isMatch(password, user.password)) {
            return res.status(401).send('Unauthorized');
        }

        // generate a jwt token
        const token = generateToken({_id: user._id});

        // return the token
        return res.status(200).json({ token });
    }).catch(err => {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    });
});

// update score in the background
const updateScoreInBackground = ({user_id, score}) => {
    // find the user with the id
    User.findById(user_id).then(user => {
        // check if the user exists
        if (!user) return;

        // update the score
        user.score = score;
        // save the user
        user.save().then(() => {
            console.log('Score updated in the database');
        }).catch(err => {
            console.error(err);
        });
    }).catch(err => {
        console.error(err);
    });
};

// to update score
router.post('/score', isLoggedIn, (req, res) => {
    // get the score from the request body
    const { score } = req.body;
    // check if the score exists
    if (!score || typeof score !== 'number') {
        return res.status(400).send('Bad Request');
    }

    // update the score in redis (write-behind cache)
    redis.upsertScoreInRedis({user_id: req.user._id, score}).then(() => {
        console.log('Score updated in redis');
        // write the score to the database in the background
        updateScoreInBackground({user_id: req.user._id, score});
        // return a 202 Accepted
        return res.status(202).send('Accepted');
    }).catch((err) => {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    });

});


// export the router
module.exports = router;
