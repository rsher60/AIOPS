#!/bin/bash
cd "$(dirname "$0")"

# Load environment variables from .env.local
if [ -f .env.local ]; then
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        # Export the variable
        export "$key=$value"
    done < .env.local
fi

# Start FastAPI with uvicorn
cd api
../venv/bin/python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
