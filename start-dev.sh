#!/bin/bash
echo "Starting Oner development servers..."
echo

echo "Starting backend on port 3000..."
cd backend && node server.js &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on port 5173..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo
echo "Oner is starting up!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
