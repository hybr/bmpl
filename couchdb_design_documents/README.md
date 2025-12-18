# CouchDB Design Documents

This folder contains design documents for CouchDB views used by the application.

## Deploying Design Documents

### Using curl

Upload the users design document to your CouchDB database:

```bash
curl -X PUT http://admin:password@127.0.0.1:5984/bmpl_users/_design/users \
  -H "Content-Type: application/json" \
  -d @users_design_doc.json
```

### Using Fauxton

1. Open Fauxton at http://127.0.0.1:5984/_utils
2. Select the `bmpl_users` database
3. Click "Design Documents" in the sidebar
4. Click "New Doc" and paste the content from `users_design_doc.json`
5. Save the document

## Design Document: users

### Views

| View | Purpose | Key | Value |
|------|---------|-----|-------|
| `by_username` | Find user by exact username | username (lowercase) | full user doc |
| `by_email` | Find user by exact email | email (lowercase) | full user doc |
| `by_name` | Find user by name | name (lowercase) | full user doc |
| `by_phone` | Find user by phone | phone | full user doc |
| `all_users` | List all users | createdAt | user summary |
| `searchable` | Search users by any field | search terms | user summary |

### Query Examples

**Find user by username:**
```
GET /bmpl_users/_design/users/_view/by_username?key="jsmith"
```

**Search users (prefix search):**
```
GET /bmpl_users/_design/users/_view/searchable?startkey="john"&endkey="john\ufff0"
```

**Get all users:**
```
GET /bmpl_users/_design/users/_view/all_users
```
