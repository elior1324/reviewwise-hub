import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  className?: string;
}

// Uses Cloudflare's visible test key by default — replace with your real site key
const TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

const TurnstileWidget = ({ onSuccess, onError, className }: TurnstileWidgetProps) => (
  <div className={className}>
    <Turnstile
      siteKey={TURNSTILE_SITE_KEY}
      onSuccess={onSuccess}
      onError={onError}
      options={{ theme: "auto", size: "flexible" }}
    />
  </div>
);

export default TurnstileWidget;
