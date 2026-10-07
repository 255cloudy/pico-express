#!/bin/bash

# --- CONFIGURATION ---
TOTAL_REQUESTS=${1:-100}       # Number of requests (default: 100)
MIN_LEN=${2:-4}                # Minimum string length in bytes (default: 4)
MAX_LEN=${3:-64}               # Maximum string length in bytes (default: 64)
# ---------------------

echo "Starting to send $TOTAL_REQUESTS requests with random lengths (between $MIN_LEN and $MAX_LEN bytes) to localhost:10000..."

for ((i=1; i<=TOTAL_REQUESTS; i++)); do
    # Generate a random length between MIN_LEN and MAX_LEN
    RANDOM_LEN=$(( MIN_LEN + RANDOM % (MAX_LEN - MIN_LEN + 1) ))
    
    # Generate a random string using the random length
    RANDOM_STRING=$(head -c "$RANDOM_LEN" /dev/urandom | base64)
    
    # Send the request using curl (-s for silent mode)
    curl -s -X POST -d "data=$RANDOM_STRING" http://localhost:10000
    
    echo "[$i/$TOTAL_REQUESTS] (Len: $RANDOM_LEN) Sent: $RANDOM_STRING"
    
    # Optional: uncomment if you need a delay between requests
    # sleep 0.1
done

echo "Finished sending all requests!"