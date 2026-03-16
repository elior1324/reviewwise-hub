import { useState, useEffect } from "react";
import { Accessibility, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

type AccessibilitySettings = {
  fontSize: number; // 0 = normal, 1 = large, 2 = x-large
  highContrast: boolean;
  reducedMotion: boolean;
  linkHighlight: boolean;
  readableFont: boolean;
  bigCursor: boolean;
  grayscale: boolean;
  textSpacing: boolean;
  invertColors: boolean;
};

const defaults: AccessibilitySettings = {
  fontSize: 0,
  highContrast: false,
  reducedMotion: false,
  linkHighlight: false,
  readableFont: false,
  bigCursor: false,
  grayscale: false,
  textSpacing: false,
  invertColors: false,
};

const AccessibilityMenu = () => {
  const { t } = useLanguage();

  // Font size label array — translated
  const fontSizeLabels = [
    t("accessibility.fontNormal"),
    t("accessibility.fontLarge"),
    t("accessibility.fontXLarge"),
  ];

  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem("a11y-settings");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
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

    // Toggle classes
    root.classList.toggle("a11y-high-contrast", settings.highContrast);
    root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);
    root.classList.toggle("a11y-link-highlight", settings.linkHighlight);
    root.classList.toggle("a11y-readable-font", settings.readableFont);
    root.classList.toggle("a11y-big-cursor", settings.bigCursor);
    root.classList.toggle("a11y-grayscale", settings.grayscale);
    root.classList.toggle("a11y-text-spacing", settings.textSpacing);
    root.classList.toggle("a11y-invert-colors", settings.invertColors);
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

  const hasAnyActive = Object.entries(settings).some(([key, val]) => {
    if (key === "fontSize") return val !== 0;
    return val === true;
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full border border-border/50 relative ${hasAnyActive ? "text-primary border-primary/50" : ""}`}
          aria-label={t("accessibility.title")}
        >
          <Accessibility size={18} />
          {hasAnyActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* Always render accessibility menu in document direction */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={cycleFontSize}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.fontSize")}</span>
            <span className="text-xs text-muted-foreground">{fontSizeLabels[settings.fontSize]}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("highContrast")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.highContrast")}</span>
            {isActive("highContrast") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("reducedMotion")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.reducedMotion")}</span>
            {isActive("reducedMotion") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("linkHighlight")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.linkHighlight")}</span>
            {isActive("linkHighlight") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("readableFont")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.readableFont")}</span>
            {isActive("readableFont") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("bigCursor")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.bigCursor")}</span>
            {isActive("bigCursor") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("grayscale")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.grayscale")}</span>
            {isActive("grayscale") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("textSpacing")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.textSpacing")}</span>
            {isActive("textSpacing") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggle("invertColors")}>
          <span className="flex items-center justify-between w-full">
            <span>{t("accessibility.invertColors")}</span>
            {isActive("invertColors") && <span className="text-xs text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={resetAll} className="text-muted-foreground">
          <span className="flex items-center gap-2">
            <RotateCcw size={14} />
            {t("accessibility.reset")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccessibilityMenu;
