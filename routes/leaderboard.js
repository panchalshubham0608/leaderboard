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


// export the router
module.exports = router;
