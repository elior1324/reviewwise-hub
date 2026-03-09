

# DNS Configuration for `reviewshub.info`

To connect your custom domain **reviewshub.info** to your Lovable project, add the following DNS records at your domain registrar (Cloudflare):

```text
┌──────┬──────┬─────────────────┬────────────────┐
│ Type │ Name │ Value            │ TTL            │
├──────┼──────┼─────────────────┼────────────────┤
│ A    │ @    │ 185.158.133.1    │ Auto           │
│ A    │ www  │ 185.158.133.1    │ Auto           │
│ TXT  │ _lovable │ (will be provided │ Auto       │
│      │          │ in setup flow)    │            │
└──────┴──────┴─────────────────┴────────────────┘
```

## Steps

1. Go to **Cloudflare Dashboard** → DNS → Records for `reviewshub.info`
2. Add an **A record**: Name `@`, Value `185.158.133.1`, Proxy status **DNS only** (grey cloud)
3. Add an **A record**: Name `www`, Value `185.158.133.1`, Proxy status **DNS only** (grey cloud)
4. In Lovable: Go to **Project Settings → Domains → Connect Domain**
5. Enter `reviewshub.info` — Lovable will give you a TXT verification value
6. Add the **TXT record**: Name `_lovable`, Value from the setup flow
7. Also add `www.reviewshub.info` as a second domain in Lovable
8. Set one as **Primary** (the other will redirect)
9. SSL is provisioned automatically by Lovable

**Important**: If using Cloudflare, set the proxy to **DNS only** (grey cloud icon) during setup. You can enable the orange cloud proxy after SSL is active.

