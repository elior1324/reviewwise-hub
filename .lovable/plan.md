

## Plan: Fix Demo Button Not Working

The demo button code is correct, but `BusinessFooter` is receiving a ref it can't handle (same issue as `InvoiceTemplateUploader` before). This React warning can interfere with event handling.

### Fix

**`src/components/BusinessFooter.tsx`** — Wrap with `React.forwardRef` so it properly handles refs passed by parent components, eliminating the console error that may be blocking interaction.

