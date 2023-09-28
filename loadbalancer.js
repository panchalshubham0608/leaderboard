// imports
const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');


// configure the app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// node loadbalancer.js <filename>
// get port numbers from command line arguments
if (process.argv.length < 3) {
    console.error('Please specify the filename containing port numbers');
    console.error('node loadbalancer.js <filename>');
    process.exit(1);
}

// read the port numbers from the file
const filename = process.argv[2];
if (!fs.existsSync(filename)) {
    console.error(`${filename} does not exist`);
    process.exit(1);
}

// read the port numbers from the file
const fileContents = fs.readFileSync(filename, 'utf-8');
const portNumbers = fileContents.split('\n')[0].split(' ');
const ports = portNumbers.filter(portNumber => portNumber !== '' && !isNaN(portNumber)).map(portNumber => parseInt(portNumber.trim()));

// get the port number of the load balancer
const loadBalancerPort = 8080;

// maintains the index of the port to which the next request will be sent
let index = 0;

// setup a handler for any request that comes to the load balancer
const handler = async (req, res) => {
    const { method, url, headers, body } = req;
    console.log(`[${new Date().toLocaleString()}]: ${method} ${url} ${JSON.stringify(headers)} ${JSON.stringify(body)}`);

    // send the request to the next server
    const port = ports[index];
    index = (index + 1) % ports.length;

    const serverUrl = `http://localhost:${port}${url}`;
    console.log(`Forwarding request to ${serverUrl}`);
    console.log(`${method} ${serverUrl}`);
    try {
        let response = await axios({
            method,
            url: `http://localhost:${port}${url}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': headers.authorization,
            },
            data: body
        });
        res.status(response.status).send(response.data);
    } catch (error) {
        console.log(error);
        if (!error.response) {
            return res.status(500).send('Internal Server Error');
        }
        res.status(error.response.status || 500).send(error.response.data);
    } finally {
        console.log(`Request served from port ${port} at ${new Date().toLocaleString()}`);
    }
};

// pass all requests to the handler
app.use((req, res) => {handler(req, res)});

// start the load balancer
app.listen(loadBalancerPort, () => {
    console.log(`Load balancer started on port ${loadBalancerPort}`);
    console.log(`Forwarding requests to ports ${ports}`);
});
