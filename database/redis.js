// imports
const { default: mongoose } = require('mongoose');
const redis = require('redis');

// create a redis instance for local redis server
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
});

// check for errors
redisClient.on('error', (err) => {
    console.error(err);
});

// add users to redis
const SORTED_SET_KEY = 'leaderboard';

// add a user to redis
const addUserToRedis = ({user_id, username}) => {
    return new Promise((resolve, reject) => {
        if (!user_id || !username) {
            reject('user_id or username not provided');
            return;
        }

        // hSet will add/update the username of the user with key user_id
        redisClient.hSet(user_id.toString(), {
            'username': username
        }).then((reply) => {
            resolve(reply);
        }).catch((err) => {
            reject(err);
        });
    });
};

// insert/update score of a user in redis
const upsertScoreInRedis = ({user_id, score}) => {
    return new Promise((resolve, reject) => {
        if (!user_id || !Number.isInteger(score) || score < 0) {
            reject('user_id or score not provided');
            return;
        }

        // zAdd will add/update the score of the user
        redisClient.zAdd(SORTED_SET_KEY, {
            score,
            value: user_id.toString()
        }).then((reply) => {
            resolve(reply);
        }).catch((err) => {
            reject(err);
        });
    });
}

// get top k users from redis
const getTopKUsersFromRedis = (k) => {
    return new Promise((resolve, reject) => {
        if (!k || !Number.isInteger(k) || k < 1) {
            reject('k not provided or not an integer or less than 1');
            return;
        }

        // zRevRange will return the top k users
        redisClient.zRangeWithScores(SORTED_SET_KEY, 0, k - 1, { REV: true }).then((reply) => {
            // for each user retrieve the username
            let promises = [];
            reply.forEach((user) => {
                promises.push(new Promise((resolve, reject) => {
                    redisClient.hGet(user.value, 'username').then((username) => {
                        resolve({
                            username,
                            score: user.score
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                }));
            });

            // wait for all promises to resolve
            Promise.all(promises).then((reply) => {
                resolve(reply);
            }).catch((err) => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
}

// get score of a user from redis
const getUserScoreFromRedis = (user_id) => {
    return new Promise((resolve, reject) => {
        if (!user_id) {
            reject('user_id not provided');
            return;
        }

        // zScore will return the score of the user
        redisClient.zScore(SORTED_SET_KEY, user_id.toString()).then((reply) => {
            resolve(reply);
        }).catch((err) => {
            reject(err);
        });
    });
}



// connect to the redis server
console.log('Connecting to Redis server...');
redisClient.connect().then(() => {
    console.log('Connected to Redis server');
}).catch((err) => {
    console.error("Failed to connect to Redis server");
    console.log(err);
});

// export the redis client
module.exports = {
    redisClient,
    addUserToRedis,
    upsertScoreInRedis,
    getTopKUsersFromRedis,
    getUserScoreFromRedis
}
