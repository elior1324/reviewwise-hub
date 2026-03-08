import { useState, useEffect } from "react";
import { Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccessibilitySettings = {
  fontSize: number; // 0 = normal, 1 = large, 2 = x-large
  highContrast: boolean;
  reducedMotion: boolean;
  linkHighlight: boolean;
};

const defaults: AccessibilitySettings = {
  fontSize: 0,
  highContrast: false,
  reducedMotion: false,
  linkHighlight: false,
};

const fontSizeLabels = ["רגיל", "גדול", "גדול מאוד"];

const AccessibilityMenu = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem("a11y-settings");
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem("a11y-settings", JSON.stringify(settings));
    const root = document.documentElement;

    // Font size
    const sizes = ["100%", "115%", "130%"];
    root.style.fontSize = sizes[settings.fontSize];

    // High contrast
    root.classList.toggle("a11y-high-contrast", settings.highContrast);

    // Reduced motion
    root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);

    // Link highlight
    root.classList.toggle("a11y-link-highlight", settings.linkHighlight);
  }, [settings]);

  const toggle = (key: keyof Omit<AccessibilitySettings, "fontSize">) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cycleFontSize = () => {
    setSettings((prev) => ({ ...prev, fontSize: (prev.fontSize + 1) % 3 }));
  };

  const resetAll = () => {
    setSettings(defaults);
  };

  const isActive = (key: keyof Omit<AccessibilitySettings, "fontSize">) => settings[key];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border/50"
          aria-label="תפריט נגישות"
        >
          <Accessibility size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={cycleFontSize}>
          <span className="flex items-center justify-between w-full">
            <span>גודל טקסט</span>
            <span className="text-xs text-muted-foreground">{fontSizeLabels[settings.fontSize]}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("highContrast")}>
          <span className="flex items-center justify-between w-full">
            <span>ניגודיות גבוהה</span>
            {isActive("highContrast") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("reducedMotion")}>
          <span className="flex items-center justify-between w-full">
            <span>הפחתת אנימציות</span>
            {isActive("reducedMotion") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("linkHighlight")}>
          <span className="flex items-center justify-between w-full">
            <span>הדגשת קישורים</span>
            {isActive("linkHighlight") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={resetAll} className="text-muted-foreground">
          איפוס הגדרות
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccessibilityMenu;
