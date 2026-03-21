/**
 * BusinessNavbar — thin wrapper that activates business mode and delegates
 * rendering to the unified Navbar component.
 *
 * All business-portal pages import this component. By making it a wrapper
 * around Navbar we guarantee a single source of truth for navbar appearance,
 * behaviour, breakpoints, spacing, and typography across every route.
 *
 * Lifecycle:
 *  • On mount  → switchToBusinessMode() so Navbar renders the dark business variant
 *  • On unmount → switchToUserMode()   so Navbar reverts when the user navigates away
 */
import { useEffect } from "react";
import { useAppMode } from "@/contexts/ModeContext";
import Navbar from "./Navbar";

const BusinessNavbar = () => {
  const { switchToBusinessMode, switchToUserMode } = useAppMode();

  useEffect(() => {
    switchToBusinessMode();
    return () => switchToUserMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Navbar />;
};

export default BusinessNavbar;
