// imports
const request = require('request');
const async = require('async');

// get number of threads and number of requests per thread from command line arguments
// node loadtest.js <number of threads> <number of requests per thread>
if (process.argv.length < 4) {
    console.error('Please specify the number of threads and number of requests per thread');
    process.exit(1);
}

const numThreads = parseInt(process.argv[2]);
const numRequestsPerThread = parseInt(process.argv[3]);

// check if the arguments are numbers
if (isNaN(numThreads) || isNaN(numRequestsPerThread)) {
    console.error('Please specify the number of threads and number of requests per thread');
    process.exit(1);
}


// request options
const baseUrl = 'http://localhost:8080';
const options = {
    url: baseUrl + '/users',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};


// keep track of the response times
let avgResponseTimes = [];
let totalUnsuccessfulRequests = 0;

// function to make requests
function makeRequests({threadId, numRequestsPerThread}) {
    // array to store the response times
    let responseTimes = [];

    // make requests
    async.times(numRequestsPerThread, (i, next) => {
        // start the timer
        const start = new Date().getTime();

        // make the request
        request(options, (err, res, body) => {
            // stop the timer
            const end = new Date().getTime();

            // calculate the response time
            const responseTime = end - start;

            // store the response time
            responseTimes.push(responseTime);

            if (err) {
                // console.error(err);
                totalUnsuccessfulRequests++;
            } else if (res.statusCode !== 200) {
                // console.error(res.statusCode);
                totalUnsuccessfulRequests++;
            }

            // call next
            next();

        });
    }, (err) => {
        // calculate the average response time
        const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
        avgResponseTimes.push(avgResponseTime);

        // log the average response time
        // console.log(`\n[Thread #${threadId}] Average response time: ${avgResponseTime} ms`);

        // log the overall average response time
        let overallAvgResponseTime = Math.round(avgResponseTimes.reduce((a, b) => a + b) / avgResponseTimes.length);
        process.stdout.write("\rOverall average response time: " + overallAvgResponseTime + "ms, Unsuccesful requests: " + totalUnsuccessfulRequests);
    });
}


// make requests from each thread
async.times(numThreads, (i, next) => {
    let threadId = i + 1;
    makeRequests({threadId, numRequestsPerThread});
    next();
}, (err) => {
    // do nothing
});

// kill threads when the process is terminated
process.on('SIGINT', () => {
    process.exit(0);
});
