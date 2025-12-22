#!/bin/bash

# Seed India Legal Types to CouchDB
# This script populates the bmpl_common database with Indian organization legal types

echo "============================================================"
echo "Seed India Legal Types to CouchDB"
echo "============================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if CouchDB is running
echo "Checking if CouchDB is running..."
if ! curl -s http://127.0.0.1:5984/ > /dev/null 2>&1; then
    echo "ERROR: CouchDB is not running at http://127.0.0.1:5984/"
    echo "Please start CouchDB first"
    exit 1
fi
echo "CouchDB is running!"
echo ""

# Check if bmpl_common database exists
echo "Checking if bmpl_common database exists..."
if ! curl -s -f http://admin:password@127.0.0.1:5984/bmpl_common > /dev/null 2>&1; then
    echo "WARNING: bmpl_common database does not exist"
    echo "Creating database..."
    curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_common
    echo ""
fi
echo "Database exists!"
echo ""

# Check if nano is installed
cd api
if ! npm list nano > /dev/null 2>&1; then
    echo "Installing nano package..."
    npm install nano
    echo ""
fi
cd ..

# Run the seeding script
echo "Running seeding script..."
echo ""
node scripts/seed-india-legal-types.js "$@"

echo ""
echo "============================================================"
echo "Done!"
echo "============================================================"
