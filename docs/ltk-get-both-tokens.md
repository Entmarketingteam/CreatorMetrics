# How to Get Both LTK Tokens

## Why You Need Both Tokens

The LTK API requires **TWO separate Auth0 tokens**:

1. **Access Token** → Sent via `Authorization: Bearer {token}` header
2. **ID Token** → Sent via `x-id-token: {token}` header

Both tokens are stored as cookies in your browser when logged into creator.shopltk.com.

---

## Step-by-Step Instructions

### 1. Log In to LTK Creator Portal
Go to https://creator.shopltk.com and log in with your credentials.

### 2. Open Browser DevTools
Press **F12** (or right-click → Inspect) to open Developer Tools.

### 3. Go to Console Tab
Click on the **Console** tab in DevTools.

### 4. Run This JavaScript Code
Copy and paste the following code into the console:

```javascript
// Get both tokens from cookies (improved version)
const cookies = document.cookie.split('; ');

console.log('=== SEARCHING FOR LTK AUTH TOKENS ===\n');

// Try multiple possible cookie names
const possibleAccessTokenNames = [
  'auth._token.auth0',
  'auth.token.auth0',
  '_token.auth0'
];

const possibleIdTokenNames = [
  'auth._id_token.auth0',
  'auth.id_token.auth0',
  '_id_token.auth0'
];

let accessToken = null;
let idToken = null;

// Search for access token
for (const name of possibleAccessTokenNames) {
  const cookie = cookies.find(row => row.startsWith(name + '='));
  if (cookie) {
    accessToken = cookie.split('=')[1];
    console.log('✅ Found Access Token in cookie:', name);
    break;
  }
}

// Search for ID token
for (const name of possibleIdTokenNames) {
  const cookie = cookies.find(row => row.startsWith(name + '='));
  if (cookie) {
    idToken = cookie.split('=')[1];
    console.log('✅ Found ID Token in cookie:', name);
    break;
  }
}

console.log('\n=== RESULTS ===\n');

if (accessToken && idToken) {
  console.log('Access Token:', accessToken);
  console.log('\nID Token:', idToken);
  
  // Copy to clipboard
  navigator.clipboard.writeText(JSON.stringify({ accessToken, idToken }, null, 2));
  console.log('\n✅ Both tokens copied to clipboard!');
} else {
  console.log('❌ PROBLEM:');
  if (!accessToken) console.log('  - Access Token NOT found');
  if (!idToken) console.log('  - ID Token NOT found');
  console.log('\n📋 All cookies:', cookies);
  console.log('\n💡 Try the manual method in docs/ltk-debug-cookies.md');
}
```

### 5. Copy the Tokens
The code will print both tokens and copy them to your clipboard as JSON.

### 6. Paste Into CreatorMetrics
1. Go to `/ltk-test` page in CreatorMetrics
2. Paste the **Access Token** into the first field
3. Paste the **ID Token** into the second field
4. Click "Test All 14 LTK Endpoints"

---

## Token Expiration

- **Access Tokens** expire after ~1 hour
- **ID Tokens** expire after ~28 hours

If you get 401 errors, get fresh tokens by running the script again.

---

## Example Output

```
=== LTK AUTH TOKENS ===

Access Token (auth._token.auth0):
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...

ID Token (auth._id_token.auth0):
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...

=======================

✅ Both tokens copied to clipboard!
```

---

## Troubleshooting

**"NOT FOUND" for one or both tokens:**
- Make sure you're logged into creator.shopltk.com
- Try logging out and logging back in
- Check that cookies are enabled in your browser

**401 Unauthorized errors:**
- Your tokens have expired
- Get fresh tokens by running the script again

**404 errors:**
- Some endpoints may not be available for your account level
- Ensure you're using the correct account_id and publisher_id
