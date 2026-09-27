# KMS Control Center v2 — Cloudflare Pages

Duplikat dari `C:\Users\agungchn\Documents\Codex\2026-09-20\referenced-chatgpt-conversation-this-is-an\kms-control-center\dist\index.html` (Sites `plakatku.chatgpt.site`) agar **Anda Owner**.

## Deploy Cloudflare Pages
1. GitHub: push folder `kms-control-center-v2` ke repo baru `karyamedia/kms-control-center-v2`
2. Cloudflare Dashboard > Pages > Create project > Connect to Git > pilih repo > Build settings: `Framework: None`, `Build command: (kosong)`, `Output directory: .`
3. Environment Variables (Production):
   - `AIRTABLE_TOKEN` = `pat...` (buat di airtable.com/create/tokens, Secret)
   - `AIRTABLE_BASE_ID` = `appAGK4m9RXRiQ9dc` (Secret)
   - `N8N_WEBHOOK_URL` = `https://kms-webhook.agungclaw.site/webhook/a1b2c3d4-9e8f-4a5b-8c7d-6e5f4a3b2c1d/webhook` (atau `https://kms-n8n.agungclaw.site`)
   - `WHATSAPP_PHONE_NUMBER_ID` = `1282500208286521`
4. Deploy → domain `control.karyamediasouvenir.com` (Cloudflare DNS CNAME ke Pages).

## Lokal
Buka `index.html` langsung di browser untuk preview. Data `Airtable` + `n8n` di-load via `fetch` di `index.html` baris 28 (`fetch('https://kms-webhook.../webhook/kms-approval-action')`).

## Beda dengan v1 (Sites plakatku)
- v1 Owner: akun Codec pembuat (Anda Viewer)
- v2 Owner: `plakatku@gmail.com` / `karyamedia_jogja@yahoo.com` (Anda bisa Edit + Publish sendiri dengan bantuan LLM)

> Dibuat 2026-09-23 — scaffolding untuk Cloudflare Pages.

## Endpoint: Purge cache + Revalidate (`functions/api/purge.js`)

Server-side function untuk purge Cloudflare cache & revalidate ISR tanpa perlu PC lokal / GitHub Actions. Panggil dari agent mana pun (n8n, browser, script).

> **Arsitektur:** project ini adalah **Worker dengan static assets** (`wrangler.jsonc`), **bukan Pages**. Router di `worker.js`: `/api/*` → modul di `functions/api/`, sisanya → aset statis (`index.html`). Deploy = `wrangler deploy` (push ke Git TIDAK auto-deploy).

### Secrets (sudah terpasang via `wrangler secret`)

| Name | Fungsi |
|------|--------|
| `CF_API_TOKEN` | Token Cloudflare `karyamedia-purge` — dipakai purge |
| `PURGE_SECRET` | Kunci akses endpoint — dikirim sebagai header `x-api-key` |
| `REVALIDATION_SECRET` | Revalidate ISR karyamedia-web (fitur `revalidate` opsional) |
| `AIRTABLE_TOKEN` / `AIRTABLE_BASE_ID` | Untuk `/api/state` (dashboard) |

Ubah/hapus: `wrangler secret put <NAME>` dari folder ini, atau dashboard Workers → Settings → Variables &amp; Secrets.

### Cara pakai

```bash
# Purge halaman tertentu (+ revalidate blog)
curl -X POST https://kms-control-center-v2.plakatku.workers.dev/api/purge \
  -H "Content-Type: application/json" \
  -H "x-api-key: <PURGE_SECRET>" \
  -d '{"paths":["/blog/plakat-akrilik-custom"],"revalidate":"blog"}'

# Purge semua cache
curl -X POST https://kms-control-center-v2.plakatku.workers.dev/api/purge \
  -H "Content-Type: application/json" \
  -H "x-api-key: <PURGE_SECRET>" \
  -d '{"all":true,"revalidate":"all"}'
```

`revalidate` (opsional): `blog` | `product` | `all`. Balasan sukses: `{"ok":true,"purged":1,"revalidate":{"revalidated":true,...}}`.

### Deploy

Dari folder ini: `wrangler deploy` (butuh `wrangler login`). Aset: `.assetsignore` mengecualikan `.git`, README, konfigurasi dari publik.
