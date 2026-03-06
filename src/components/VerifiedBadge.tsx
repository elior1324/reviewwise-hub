import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

const VerifiedBadge = () => (
  <Badge className="bg-trust-green-light text-trust-green border-0 gap-1 font-body text-xs">
    <ShieldCheck size={14} />
    רכישה מאומתת
  </Badge>
);

export default VerifiedBadge;
