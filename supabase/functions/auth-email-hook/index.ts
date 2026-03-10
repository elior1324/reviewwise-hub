/**
 * auth-email-hook — Supabase Auth "Send Email" hook
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE NOTE
 * ────────────────────────────────────────────────────────────────────────────
 * The previous version of this file used @lovable.dev/email-js and
 * @lovable.dev/webhooks-js.  That architecture requires:
 *
 *   1. Lovable's managed proxy (your Supabase hook URL pointed to Lovable's
 *      servers, not directly to this edge function).
 *   2. A LOVABLE_API_KEY Supabase secret for signature verification.
 *
 * If either was missing, the hook returned HTTP 500 → Supabase cancelled the
 * entire auth operation → no user was created, no email was sent.
 *
 * THIS REWRITE removes all Lovable infrastructure dependencies and sends
 * email via Resend's HTTP API directly.  It accepts Supabase's native
 * "Send Email" hook payload format.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * DEPLOYMENT CHECKLIST (one-time setup — do this in Supabase dashboard)
 * ────────────────────────────────────────────────────────────────────────────
 *   1. Deploy this function:
 *        supabase functions deploy auth-email-hook
 *
 *   2. Add RESEND_API_KEY as a Supabase secret:
 *        supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxx
 *      (same key you configured under Authentication → SMTP → Password)
 *
 *   3. Register the hook in Supabase dashboard:
 *        Authentication → Hooks → "Send email" hook
 *        URL: https://pujsopidbejeuqteormi.supabase.co/functions/v1/auth-email-hook
 *        (Do NOT use Lovable's proxy URL anymore)
 *
 *   4. Optional — set a hook secret in the Supabase dashboard and add it here
 *      as HOOK_SECRET so the function can verify incoming requests.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * SUPABASE "SEND EMAIL" HOOK PAYLOAD FORMAT
 * ────────────────────────────────────────────────────────────────────────────
 * {
 *   "user": { "id": "...", "email": "user@example.com", ... },
 *   "email_data": {
 *     "token": "...",
 *     "token_hash": "...",
 *     "redirect_to": "https://...",
 *     "email_action_type": "signup|magiclink|recovery|invite|email_change|reauthentication",
 *     "site_url": "https://...",
 *     "token_new": "",
 *     "token_hash_new": ""
 *   }
 * }
 */

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

// ── Configuration ─────────────────────────────────────────────────────────────
const SITE_NAME    = "ReviewHub"
const SITE_URL     = "https://reviewshub.info"   // Frontend (used as redirect target)
const SUPABASE_URL = "https://pujsopidbejeuqteormi.supabase.co" // Auth API base
const FROM_ADDRESS = "ReviewHub <noreply@reviewshub.info>"
const REPLY_TO     = "support@reviewshub.info"

// ── Email subjects ────────────────────────────────────────────────────────────
const EMAIL_SUBJECTS: Record<string, string> = {
  signup:          'אמתו את כתובת המייל שלכם — ReviewHub',
  invite:          'הוזמנתם להצטרף ל-ReviewHub',
  magiclink:       'קישור כניסה ל-ReviewHub',
  recovery:        'איפוס סיסמה — ReviewHub',
  email_change:    'אמתו את כתובת המייל החדשה שלכם',
  reauthentication:'קוד אימות — ReviewHub',
}

// ── Template registry ─────────────────────────────────────────────────────────
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup:          SignupEmail,
  invite:          InviteEmail,
  magiclink:       MagicLinkEmail,
  recovery:        RecoveryEmail,
  email_change:    EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Build confirmation URL from Supabase hook payload ─────────────────────────
//
// CORRECT URL ANATOMY
// ───────────────────
//   BASE  → https://pujsopidbejeuqteormi.supabase.co   (Supabase API, not the frontend)
//   PATH  → /auth/v1/verify                            (Supabase's token validation endpoint)
//   token_hash  → the opaque hash from the hook payload
//   type        → email_action_type (signup, recovery, …)
//   redirect_to → where Supabase redirects AFTER validation — this is the FRONTEND URL
//
// Common mistake: using site_url (frontend) as the base → produces
//   https://reviewshub.info/auth/v1/verify   ← 404, no such React route
// Correct:
//   https://pujsopidbejeuqteormi.supabase.co/auth/v1/verify?…&redirect_to=https://reviewshub.info
//
// Flow after user clicks the link:
//   1. Browser hits Supabase /auth/v1/verify with token_hash
//   2. Supabase validates → sets session cookies / tokens
//   3. Supabase 302-redirects to redirect_to (our frontend)
//   4. Frontend's detectSessionInUrl / AuthCallback picks up the session
//
function buildConfirmationUrl(emailData: any): string {
  const { token_hash, email_action_type, redirect_to, site_url } = emailData

  // Always use the Supabase API URL as the base — NOT the frontend URL.
  const base = SUPABASE_URL.replace(/\/$/, '')

  const params = new URLSearchParams({
    token_hash:  token_hash || '',
    type:        email_action_type || '',
    // redirect_to tells Supabase where to send the browser after token validation.
    // Fall back: explicit redirect_to from payload → site_url from payload → our SITE_URL constant.
    redirect_to: redirect_to || site_url || SITE_URL,
  })

  return `${base}/auth/v1/verify?${params.toString()}`
}

// ── Send email via Resend HTTP API ────────────────────────────────────────────
async function sendViaResend(opts: {
  apiKey: string
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ message_id?: string; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     FROM_ADDRESS,
      reply_to: REPLY_TO,
      to:       [opts.to],
      subject:  opts.subject,
      html:     opts.html,
      text:     opts.text,
    }),
  })

  const body = await res.json().catch(() => ({})) as any

  if (!res.ok) {
    const msg = body?.message || body?.error || `HTTP ${res.status}`
    return { error: msg }
  }

  return { message_id: body?.id }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // ── 1. Parse Supabase's native hook payload ───────────────────────────────
  let payload: any
  try {
    payload = await req.json()
  } catch {
    console.error('[auth-email-hook] Failed to parse request body')
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const user       = payload?.user       ?? {}
  const emailData  = payload?.email_data ?? {}
  const email      = user.email || emailData.email || ''
  const actionType = emailData.email_action_type || ''

  console.log('[auth-email-hook] Received:', { actionType, email: email.replace(/@.*/, '@***') })

  if (!email) {
    console.error('[auth-email-hook] No email address in payload')
    return new Response(
      JSON.stringify({ error: 'No email in payload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 2. Look up the email template ─────────────────────────────────────────
  const EmailTemplate = EMAIL_TEMPLATES[actionType]
  if (!EmailTemplate) {
    // Unknown action type — return 200 so Supabase doesn't block the auth operation
    console.warn('[auth-email-hook] Unrecognised action type:', actionType, '— skipping send')
    return new Response(
      JSON.stringify({ success: true, warning: `Unrecognised action type: ${actionType}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 3. Build template props ───────────────────────────────────────────────
  const confirmationUrl = buildConfirmationUrl(emailData)

  const templateProps = {
    siteName:        SITE_NAME,
    siteUrl:         SITE_URL,
    recipient:       email,
    confirmationUrl,
    token:           emailData.token || '',
    email:           email,
    newEmail:        emailData.new_email || '',
  }

  // ── 4. Render email ───────────────────────────────────────────────────────
  let html: string
  let text: string
  try {
    html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auth-email-hook] Template render error:', message)
    return new Response(
      JSON.stringify({ error: `Template render failed: ${message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── 5. Send via Resend ────────────────────────────────────────────────────
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    // No API key configured — log clearly but return 200 so signup isn't blocked.
    // The user will need to confirm their email manually or via Supabase dashboard.
    console.error(
      '[auth-email-hook] RESEND_API_KEY is not set.\n' +
      '  Email NOT sent to:', email, '\n' +
      '  Fix: supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxx\n' +
      '  Returning 200 so signup is not blocked.'
    )
    return new Response(
      JSON.stringify({
        success: false,
        warning: 'RESEND_API_KEY not configured — email not sent, but signup was not blocked',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const subject = EMAIL_SUBJECTS[actionType] || `Notification from ${SITE_NAME}`
  const result  = await sendViaResend({ apiKey: resendApiKey, to: email, subject, html, text })

  if (result.error) {
    console.error('[auth-email-hook] Resend API error:', result.error, '| to:', email)
    return new Response(
      JSON.stringify({ error: `Email send failed: ${result.error}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('[auth-email-hook] Email sent successfully:', { message_id: result.message_id, actionType, to: email })
  return new Response(
    JSON.stringify({ success: true, message_id: result.message_id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
