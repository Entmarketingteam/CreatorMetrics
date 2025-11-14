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
// Get both tokens from cookies
const cookies = document.cookie.split('; ');

const accessToken = cookies
  .find(row => row.startsWith('auth._token.auth0='))
  ?.split('=')[1];

const idToken = cookies
  .find(row => row.startsWith('auth._id_token.auth0='))
  ?.split('=')[1];

console.log('=== LTK AUTH TOKENS ===');
console.log('\nAccess Token (auth._token.auth0):');
console.log(accessToken || 'NOT FOUND');
console.log('\nID Token (auth._id_token.auth0):');
console.log(idToken || 'NOT FOUND');
console.log('\n=======================');

// Copy both tokens to clipboard as JSON
navigator.clipboard.writeText(JSON.stringify({ accessToken, idToken }, null, 2));
console.log('\n✅ Both tokens copied to clipboard!');
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
