# Debug LTK Cookies - Find Your Tokens

## Step 1: See ALL Your Cookies

Go to https://creator.shopltk.com (make sure you're logged in), open Console (F12), and run:

```javascript
// List ALL cookies to see what's available
console.log('=== ALL COOKIES ===');
document.cookie.split('; ').forEach(cookie => {
  console.log(cookie);
});
console.log('===================');
```

This will show you every cookie. Look for ones containing "auth" or "token".

---

## Step 2: Find Auth0 Tokens (Better Script)

Try this improved script that searches more flexibly:

```javascript
// More flexible token search
const cookies = document.cookie.split('; ');

console.log('=== SEARCHING FOR AUTH0 TOKENS ===\n');

// Show all auth-related cookies
const authCookies = cookies.filter(c => 
  c.toLowerCase().includes('auth') || 
  c.toLowerCase().includes('token')
);

console.log('Auth-related cookies found:');
authCookies.forEach(c => console.log('  -', c.substring(0, 100) + '...'));

console.log('\n=== EXTRACTING TOKENS ===\n');

// Try different possible cookie names
const possibleAccessTokenNames = [
  'auth._token.auth0',
  'auth.token.auth0',
  '_token.auth0',
  'access_token',
  'auth0.access_token'
];

const possibleIdTokenNames = [
  'auth._id_token.auth0',
  'auth.id_token.auth0',
  '_id_token.auth0',
  'id_token',
  'auth0.id_token'
];

let accessToken = null;
let idToken = null;

// Search for access token
for (const name of possibleAccessTokenNames) {
  const cookie = cookies.find(row => row.startsWith(name + '='));
  if (cookie) {
    accessToken = cookie.split('=')[1];
    console.log('✅ Found Access Token in cookie:', name);
    console.log('Value:', accessToken.substring(0, 50) + '...');
    break;
  }
}

// Search for ID token
for (const name of possibleIdTokenNames) {
  const cookie = cookies.find(row => row.startsWith(name + '='));
  if (cookie) {
    idToken = cookie.split('=')[1];
    console.log('✅ Found ID Token in cookie:', name);
    console.log('Value:', idToken.substring(0, 50) + '...');
    break;
  }
}

console.log('\n=== RESULTS ===\n');

if (accessToken && idToken) {
  console.log('✅ SUCCESS! Both tokens found!');
  console.log('\nAccess Token:', accessToken);
  console.log('\nID Token:', idToken);
  
  // Copy to clipboard
  navigator.clipboard.writeText(JSON.stringify({ accessToken, idToken }, null, 2));
  console.log('\n✅ Tokens copied to clipboard!');
} else {
  console.log('❌ PROBLEM:');
  if (!accessToken) console.log('  - Access Token NOT found');
  if (!idToken) console.log('  - ID Token NOT found');
  console.log('\nPlease check the auth-related cookies listed above.');
  console.log('You may need to log out and log back in to creator.shopltk.com');
}
```

---

## Step 3: Alternative - Get Tokens from Application Tab

If the script doesn't work, manually check cookies:

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** in the left sidebar
4. Click **https://creator.shopltk.com**
5. Look for these cookies:
   - `auth._token.auth0` (this is your **Access Token**)
   - `auth._id_token.auth0` (this is your **ID Token**)
6. Copy the **Value** column for each cookie

---

## Step 4: Alternative - Get from Network Tab

1. Go to https://creator.shopltk.com/performance-analytics
2. Open DevTools (F12) → **Network** tab
3. Filter by "Fetch/XHR"
4. Click on any request to `api-gateway.rewardstyle.com`
5. Look at **Request Headers**:
   - `Authorization: Bearer <ACCESS_TOKEN>`
   - `x-id-token: <ID_TOKEN>`
6. Copy both tokens

---

## Common Issues

**"undefined" for both tokens:**
- You're not logged in to creator.shopltk.com
- The cookie names are different than expected
- Cookies are httpOnly (not accessible via JavaScript)

**Only finding one token:**
- Run the Step 2 script above - it searches more flexibly
- Try the Application/Storage tab method
- Try the Network tab method

**Cookies exist but script can't read them:**
- Use the manual Application tab method
- Or grab them from Network tab headers

---

Let me know what you see and I'll help you get the tokens!
