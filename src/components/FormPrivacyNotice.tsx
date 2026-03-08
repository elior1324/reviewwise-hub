import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

interface FormPrivacyNoticeProps {
  className?: string;
}

const FormPrivacyNotice = ({ className = "" }: FormPrivacyNoticeProps) => {
  return (
    <p className={`text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5 ${className}`}>
      <Shield size={12} className="text-primary shrink-0 mt-0.5" />
      <span>
        המידע שתמסרו ייאסף ויעובד בהתאם ל<Link to="/privacy" target="_blank" className="text-primary hover:underline">מדיניות הפרטיות</Link> שלנו.
        לפרטים נוספים על זכויותיכם, בקרו ב<Link to="/privacy" target="_blank" className="text-primary hover:underline">עמוד מדיניות הפרטיות</Link>.
      </span>
    </p>
  );
};

export default FormPrivacyNotice;
