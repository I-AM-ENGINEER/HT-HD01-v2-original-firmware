#!/bin/sh

process_stop_shutdown(){
    local name="$1"
    local timeout_sec="${2:-5}"
    local wait=0
    local pid

    if [ -f "/var/run/${name}.pid" ]; then
        pid=$(cat "/var/run/${name}.pid")
    elif [ -f "/var/run/${name}/${name}.pid" ]; then
        pid=$(cat "/var/run/${name}/${name}.pid")
    fi

    if [ -z "$pid" ]; then
        logger "Process $name - $pid not found. Nothing to stop..."
        return
    fi

    logger "Sending SIGTERM to process $name - $pid..."
    kill "$pid"

    # Wait for the process to terminate (with timeout)
    while [ $wait -lt $timeout_sec ] && ps -p "$pid" > /dev/null; do
        sleep 1
        wait=$((wait+1))
    done

    # Check if the process is still running
    if ps -p "$pid" > /dev/null; then
        logger "Process $name - $pid did not terminate within $timeout_sec seconds. Sending SIGKILL..."
        kill -9 "$pid"
    else
        logger "Process $name - $pid stopped."
    fi  
}

