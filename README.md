# ToolGenie

Free browser-based tools platform running 100% client-side with no file uploads.

## Cloudflare Configuration

### Cloudflare Redirect Rule to add trailing slashes:
- Go to Cloudflare dashboard → `toolgenie.online` zone
- Rules → Redirect Rules → Create rule
- Name: `Add trailing slash`
- When incoming requests match:
    - URI Path does not end with `/`
    - URI Path does not contain `.`
- Then: Dynamic redirect to `concat(http.request.uri.path, "/")`
- Status: `301 (Permanent)`
- Save

## Local Development & Build

```bash
npm install
npm run dev
npm run build
```
