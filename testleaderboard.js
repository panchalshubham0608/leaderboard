const request = require('request');
const async = require('async');


// get number of users to add and user-prefix from command line arguments
// node testleaderboard.js <number of users> <user-prefix> <number of threads> [<start score> = 0]

if (process.argv.length < 5) {
    console.error('Please specify the number of users, user-prefix and number of threads');
    process.exit(1);
}

const numUsers = parseInt(process.argv[2]);
if (isNaN(numUsers) || numUsers < 1) {
    console.error('Please specify the number of users');
    process.exit(1);
}

const userPrefix = process.argv[3];
if (!userPrefix) {
    console.error('Please specify the user-prefix');
    process.exit(1);
}

const numThreads = parseInt(process.argv[4]);
if (isNaN(numThreads) || numThreads < 1) {
    console.error('Please specify the number of threads');
    process.exit(1);
}

let score = parseInt(process.argv[5]) || 0;
if (isNaN(score) || score < 0) {
    console.error('Please specify the start score');
    process.exit(1);
}

let tokens = {};
let intervals = [];

function fetchToken({userIdx}) {
    return new Promise((resolve, reject) => {
        if (tokens[userIdx]) resolve();
        let email = `${userPrefix}-${userIdx}@gmail.com`;
        request({
            url: 'http://localhost:8080/users/login',
            method: 'POST',
            json: true,
            body: {
                email,
                password: 'password'
            }
        }, (err, res, body) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            tokens[userIdx] = body.token;
            resolve();
        });
    });
}

// each thread will pick a random user and increment the score
function incrementScore({userIdx}) {
    // check if the token exists

    fetchToken({userIdx}).then(() => {
        // make request to update score
        request({
            url: 'http://localhost:8080/users/score',
            method: 'POST',
            json: true,
            headers: {
                'Authorization': `Bearer ${tokens[userIdx]}`
            },
            body: { score }
        }, (err, res, body) => {
            if (err) {
                console.error(err);
                console.log(`Failed to update score for ${userPrefix}${userIdx}`);
                return;
            }

            if (res.statusCode !== 202) {
                console.log(`Failed to update score for ${userPrefix}${userIdx}`);
            }
            score += Math.floor(Math.random() * 10);
        });
    }).catch(err => {
        console.error(err);
    });

}


// spawn threads
async.times(numThreads, async (threadIdx, next) => {
    let delay = Math.floor(Math.random() * 1000);
    let interval1 = setInterval(() => {
        // pick a random user
        const userIdx = Math.floor(Math.random() * numUsers);
        // console.log(`Thread ${threadIdx} picked ${userPrefix}${userIdx}`)
        incrementScore({userIdx});
    }, delay);
    intervals.push(interval1);
}, err => {
    if (err) {
        console.error(err);
    }
});

// background thread to print the leaderboard
(async function() {
    let randomUser = null;
    let printLeaderboard = ({users}) => {
        console.log('===========');
        console.log('Rank\tUsername\tScore\tUserId');
        users.forEach((user, idx) => {
            console.log(`${idx + 1}\t${user.username}\t${user.score}\t${user.user_id}`);
            randomUser = user;
        });
    }

    let interval = setInterval(() => {
        // print the leaderboard
        request({
            url: 'http://localhost:8080/leaderboard/top/10',
            method: 'GET',
            json: true
        }, (err, res, body) => {
            if (err) {
                console.error(err);
                return;
            }

            if (res.statusCode !== 200) {
                console.error(res.statusCode);
                return;
            }

            process.stdout.write('\x1Bc');
            console.log('Absolute Leaderboard');
            printLeaderboard({users: body.users});


            // print the relative leaderboard for a random user
            if (randomUser === null) {
                console.log();
                console.log('Current Score: ', score);
                console.log('Press Ctrl+C to exit');    
            } else {
                request({
                    url: `http://localhost:8080/leaderboard/${randomUser.user_id}/top/2`,
                    method: 'GET',
                    json: true
                }, (err, res, body) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
    
                    if (res.statusCode !== 200) {
                        console.error(res.statusCode);
                        return;
                    }
    
                    console.log();
                    console.log('Relative Leaderboard for', randomUser.username);
                    printLeaderboard({users: body.users});

                    console.log();
                    console.log('Current Score: ', score);
                    console.log('Press Ctrl+C to exit');    
                });    
            }
        });
    }, 1000);

    intervals.push(interval);
})();


// clear intervals on exit
process.on('SIGINT', () => {
    intervals.forEach(interval => {
        clearInterval(interval);
    });
    process.exit(0);
});
