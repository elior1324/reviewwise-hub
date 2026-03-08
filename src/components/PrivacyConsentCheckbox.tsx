import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

interface PrivacyConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const PrivacyConsentCheckbox = ({ checked, onCheckedChange, className = "" }: PrivacyConsentCheckboxProps) => {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Checkbox
        id="privacy-consent"
        checked={checked}
        onCheckedChange={(val) => onCheckedChange(val === true)}
        className="mt-1 shrink-0"
      />
      <label htmlFor="privacy-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
        אני מאשר/ת שקראתי והסכמתי ל<Link to="/privacy" target="_blank" className="text-primary hover:underline">מדיניות הפרטיות</Link>{" "}
        ול<Link to="/terms" target="_blank" className="text-primary hover:underline">תנאי השימוש</Link> של ReviewHub.
        {" "}ידוע לי שהמידע שלי ייאסף ויעובד כמפורט במדיניות הפרטיות, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותיקון 13 (2025).
      </label>
    </div>
  );
};

export default PrivacyConsentCheckbox;
