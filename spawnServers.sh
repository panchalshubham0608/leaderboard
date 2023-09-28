# read the number of servers from the command line
numServers=$1

# check if the number of servers is valid
if [ -z "$numServers" ]
then
    echo "Please enter the number of servers to spawn"
    exit 1
fi

# run "npm start <port>" to spawn a server
currentPort=3000
ports=()
pids=()
for (( c=1; c<=$numServers; c++ ))
do
    # check if the port is already in use
    while lsof -Pi :$currentPort -sTCP:LISTEN -t >/dev/null ; do
        currentPort=$((currentPort+1))
    done
    echo "Starting server on port $currentPort"
    npm start $currentPort &
    pids+=($!)
    ports+=($currentPort)
    echo "Server started on port $currentPort"
    currentPort=$((currentPort+1))
done

# list the ports of the running servers
echo "Servers running on ports: ${ports[@]}"

# kills servers on Ctrl+C
trap ctrl_c INT
function ctrl_c() {
    echo "Killing all servers"
    for pid in "${pids[@]}"
    do
        kill $pid
    done
    echo "Servers killed"
    exit 0
}

# write all the ports to a file each in a new line
echo "Writing ports to file"
echo "${ports[@]}" > ports.txt

# wait for all servers to finish
for pid in "${pids[@]}"
do
    wait $pid
done
