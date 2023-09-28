# Leaderboard
A Node.js application for leaderboard system-design!  
Database: NoSQL (MongoDB)  
Cache: Redis


## How to run?  
Start by running multiple local instances of your server:  
```{bash}
$ ./spawnServers.sh <number of instances>
```

Start your local load-balancer:  
```{bash}
$ node loadbalancer.js ports.txt
```

Seed your database and redis-cache:  
```{bash}
$ node seeddata.js <number of users> <user-prefix> <number of threads> <start-index>
$ node seeddata.js 10000 user 10 1 # creates user1, user2, ..., user10000
```

Test leaderboard application via:  
```{bash}
$ node testleaderboard.js <number of users> <user-prefix> <number of threads>
```
