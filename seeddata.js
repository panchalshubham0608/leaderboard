const request = require('request');
const async = require('async');

// get number of users to add and user-prefix from command line arguments
// node seeddata.js <number of users> <user-prefix> <number of threads> <start index>

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

const startIndex = parseInt(process.argv[5]) || 0;
if (isNaN(startIndex) || startIndex < 0) {
    console.error('Please specify the start index');
    process.exit(1);
}

// keep track of the number of users created
let numOfUsersCreated = 0;
let failedRequests = 0;
let statusCodes = {};

// prints the progress bar
function printProgressBar() {
    let progress = Math.floor((numOfUsersCreated / numUsers) * 100);
    let progressBar = '';
    for (let i = 0; i < progress; i++) {
        progressBar += '=';
    }
    for (let i = progress; i < 100; i++) {
        progressBar += ' ';
    }
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`[${progressBar}] ${progress}%, Failed Requests: ${failedRequests}`);
    if (numOfUsersCreated === numUsers) {
        console.log();
        console.log(statusCodes);
    }
}

// function to create users from [start, end)
function createUsers(start, end) {
    async.timesSeries(end - start, (i, next) => {
        // create the user object
        let username = `${userPrefix}-${start + i}`;
        const user = {
            name: username,
            email: `${username}@gmail.com`,
            password: 'password'
        };

        // make the request
        request.post({
            url: 'http://localhost:8080/users/register',
            body: user,
            json: true
        }, (err, res, body) => {
            if (err) {
                console.error(err);
                failedRequests++;
                let statusCode = res ? res.statusCode : 'No response';
                statusCodes[res.statusCode] = (statusCodes[statusCode] || 0) + 1;
            }

            // check the status code
            if (res.statusCode !== 201) {
                // console.error(res.statusCode);
                failedRequests++;
                let statusCode = res ? res.statusCode : 'No response';
                statusCodes[res.statusCode] = (statusCodes[statusCode] || 0) + 1;
            }

            // console.log(body);
            numOfUsersCreated++;
            printProgressBar();
            let delay = Math.floor(Math.random() * 100);
            setTimeout(() => {
                next();
            }, delay);
        });
    }, (err) => {
        if (err) {
            console.error(err);
            // console.log(`Failed ${start} to ${end}`);
        }
        // console.log(`Done ${start} to ${end}`);
    });
};


// create users
let numberOfUsersPerThread = Math.floor(numUsers / numThreads);
async.timesSeries(numThreads, (i, next) => {
    let start = startIndex + i * numberOfUsersPerThread;
    let end = startIndex + (i + 1) * numberOfUsersPerThread;
    createUsers(start, end);
    next();
}, (err) => {
    if (err) {
        console.error(err);
    }
    console.log(`Creating ${numUsers} users...`);
});
