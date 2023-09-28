const request = require('request');

// get number of users to add and user-prefix from command line arguments
// node seeddata.js <number of users> <user-prefix> <number of threads>

if (process.argv.length < 5) {
    console.error('Please specify the number of users, user-prefix and number of threads.');
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

// request options
const baseUrl = 'http://localhost:8080';
const options = {
    url: baseUrl + '/users/register',
    method: 'POST',
    headers: {
        'Accept': 'application/json'
    },
    json: true,
    body: {
        email: '',
        name: '',
        password: ''
    }
};


// find number of users per thread
const numUsersPerThread = Math.floor(numUsers / numThreads);

function spawnThread({start, end}) {
    return new Promise((resolve, reject) => {
        console.log(`Spawning thread with start = ${start} and end = ${end}`);
        // spawn a thread
        for (let i = start; i < end; i++) {
            // update the request body
            let username = `${userPrefix}${i}`;
            let body = {
                email: `${username}@gmail.com`,
                name: `${username}`,
                password: `${username}1234`
            }
    
            // make the request
            request({
                ...options,
                body
            }, (err, res, body) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(body);
                }
            });
        }    
    });
}

// spawn threads
for (let i = 0; i < numThreads; i++) {
    // calculate the start and end index for the thread
    const start = i * numUsersPerThread;
    const end = (i + 1) * numUsersPerThread;

    // spawn a thread
    spawnThread({start, end});
}