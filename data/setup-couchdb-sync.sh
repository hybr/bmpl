#!/bin/bash

# CouchDB Sync Setup Script
# Run this script to set up CouchDB for syncing with PouchDB

set -e  # Exit on error

# Configuration
ADMIN_USER="${COUCHDB_ADMIN:-admin}"
ADMIN_PASS="${COUCHDB_PASSWORD:-password}"
COUCHDB_URL="http://127.0.0.1:5984"
COUCHDB_AUTH="$ADMIN_USER:$ADMIN_PASS"

echo "========================================="
echo "CouchDB Sync Setup"
echo "========================================="
echo ""

# Check if CouchDB is running
echo "1. Checking if CouchDB is running..."
if ! curl -s -f $COUCHDB_URL > /dev/null; then
    echo "❌ Error: CouchDB is not running at $COUCHDB_URL"
    echo "Please start CouchDB and try again."
    exit 1
fi
echo "✅ CouchDB is running"
echo ""

# Enable CORS
echo "2. Enabling CORS..."
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d '"true"' > /dev/null
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/_node/_local/_config/cors/origins -d '"*"' > /dev/null
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/_node/_local/_config/cors/credentials -d '"true"' > /dev/null
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"' > /dev/null
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"' > /dev/null
echo "✅ CORS enabled"
echo ""

# Create bmpl_common database
echo "3. Creating bmpl_common database..."
if curl -s -f http://$COUCHDB_AUTH@127.0.0.1:5984/bmpl_common > /dev/null 2>&1; then
    echo "⚠️  Database already exists"
else
    curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/bmpl_common > /dev/null
    echo "✅ Database created"
fi
echo ""

# Set security
echo "4. Setting database security..."
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/bmpl_common/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {
      "names": [],
      "roles": ["_admin"]
    },
    "members": {
      "names": [],
      "roles": ["authenticated_user"]
    }
  }' > /dev/null
echo "✅ Security configured"
echo ""

# Deploy design document
echo "5. Deploying design document..."
if [ -f "couchdb_design_documents/common_design_doc.json" ]; then
    curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/bmpl_common/_design/common \
      -H "Content-Type: application/json" \
      -d @couchdb_design_documents/common_design_doc.json > /dev/null 2>&1 || echo "⚠️  Design doc may already exist"
    echo "✅ Design document deployed"
else
    echo "⚠️  Design document file not found, skipping..."
fi
echo ""

# Create test user
echo "6. Creating test user..."
curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/_users/org.couchdb.user:testuser \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "org.couchdb.user:testuser",
    "name": "testuser",
    "type": "user",
    "roles": ["authenticated_user"],
    "password": "testpassword"
  }' > /dev/null 2>&1 || echo "⚠️  Test user may already exist"
echo "✅ Test user created (username: testuser, password: testpassword)"
echo ""

# Create other databases
echo "7. Creating other databases..."
for db in bmpl_users bmpl_organizations; do
    if curl -s -f http://$COUCHDB_AUTH@127.0.0.1:5984/$db > /dev/null 2>&1; then
        echo "⚠️  $db already exists"
    else
        curl -s -X PUT http://$COUCHDB_AUTH@127.0.0.1:5984/$db > /dev/null
        echo "✅ $db created"
    fi
done
echo ""

# Verify setup
echo "8. Verifying setup..."
echo ""
echo "CouchDB Info:"
curl -s http://$COUCHDB_AUTH@127.0.0.1:5984/ | python3 -m json.tool || curl -s http://$COUCHDB_AUTH@127.0.0.1:5984/
echo ""

echo "Databases:"
curl -s http://$COUCHDB_AUTH@127.0.0.1:5984/_all_dbs | python3 -m json.tool || curl -s http://$COUCHDB_AUTH@127.0.0.1:5984/_all_dbs
echo ""

echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Start your dev server: npm run dev"
echo "2. Open browser console and run:"
echo ""
echo "   // Set credentials"
echo "   window.syncConfigService.setCredentials({"
echo "     username: 'testuser',"
echo "     password: 'testpassword'"
echo "   });"
echo ""
echo "   // Initialize sync"
echo "   const remoteUrl = window.syncConfigService.getCommonDbUrl();"
echo "   await window.commonPersistence.setupSync(remoteUrl, window.syncConfigService.credentials);"
echo ""
echo "3. Access Fauxton web UI:"
echo "   http://127.0.0.1:5984/_utils"
echo ""
echo "========================================="
