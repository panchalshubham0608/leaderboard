// imports
const router = require('express').Router();
const redis = require('../database/redis');

// GET /leaderboard
router.get('/top/:count', (req, res) => {
    // get count from request params
    let count = parseInt(req.params.count);
    // check if count is valid
    if (isNaN(count) || count < 1) {
        return res.status(400).json({message: 'Bad Request'});
    }

    // get top count users from redis
    redis.getTopKUsersFromRedis(count).then((users) => {
        // return the users
        return res.status(200).json({users});
    }).catch((err) => {
        console.error(err);
        return res.status(500).json({message: 'Internal Server Error'});
    });
});

router.get('/:user_id/top/:count', (req, res) => {
    // get user_id and count from request params
    let user_id = req.params.user_id;
    let count = parseInt(req.params.count);
    // check if user_id and count are valid
    if (!user_id || isNaN(count) || count < 1) {
        return res.status(400).json({message: 'Bad Request'});
    }

    // get top count users from redis
    redis.getRelativeTopKUsersFromRedis({user_id, k: count}).then((users) => {
        // return the users
        return res.status(200).json({users});
    }).catch((err) => {
        console.error(err);
        return res.status(500).json({message: 'Internal Server Error'});
    });
});

// export the router
module.exports = router;
