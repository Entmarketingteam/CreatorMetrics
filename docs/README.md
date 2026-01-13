# LTK API Documentation

## 📚 Primary Reference Document

**👉 [`LTK-API-COMPLETE-REFERENCE.md`](./LTK-API-COMPLETE-REFERENCE.md)** ✅

**This is the authoritative source for all LTK API integration work.**

This document contains:
- ✅ All 14+ tested and working endpoints
- ✅ Complete authentication flow (Auth0 OAuth 2.0)
- ✅ Dual-header requirement (Authorization + X-id-token)
- ✅ Token refresh implementation
- ✅ Revenue matching logic for Instagram Story links
- ✅ Code examples (backend proxy + frontend client)
- ✅ Troubleshooting guide

---

## Other Documentation Files

### ⚠️ Deprecated Files (Do Not Use)

These files are outdated and may contain incorrect information:
- `ltk-api-endpoints.md` - ⚠️ **DEPRECATED** - Use `LTK-API-COMPLETE-REFERENCE.md` instead
- `ltk-auth0-integration.md` - ⚠️ **DEPRECATED** - Use `LTK-API-COMPLETE-REFERENCE.md` instead

### Reference Files (Still Useful)

- `har-endpoint-discovery.md` - Historical endpoint discovery notes
- `ltk-debug-cookies.md` - Debugging cookie/token issues
- `ltk-get-both-tokens.md` - Notes on capturing both tokens
- `ltk-integration-limitations.md` - Known limitations and workarounds
- `ltk-production-config.md` - Production deployment considerations

---

## Quick Start

1. **Read the complete reference**: [`LTK-API-COMPLETE-REFERENCE.md`](./LTK-API-COMPLETE-REFERENCE.md)
2. **Check the code examples** in the reference document
3. **Test endpoints** using the `/ltk-test` page in the app
4. **Refer to troubleshooting section** if you encounter errors

---

## Important Notes

- **Always use the complete reference document** for any new LTK API work
- **Do not reference old documentation files** - they may contain outdated paths or incorrect information
- **All endpoints have been tested and verified** - the reference document reflects the working implementation
- **Dual-header requirement is critical** - both `Authorization` and `X-id-token` headers are required for all requests
