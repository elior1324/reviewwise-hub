import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FloatingEarnCTA = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.5, ease: "easeOut" }}
      onClick={() => {
        const el = document.getElementById("earn-money");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate("/#earn-money");
        }
      }}
      className="fixed top-1/3 left-0 z-40 cursor-pointer"
    >
      <div className="flex items-center bg-primary/90 backdrop-blur-sm text-primary-foreground pl-3 pr-2 py-1.5 md:py-2 rounded-l-none rounded-r-full shadow-md hover:shadow-primary/20 transition-all duration-300 hover:pr-3 md:hover:pr-4">
        <DollarSign size={14} className="ml-1.5 shrink-0 animate-pulse" />
        <span className="font-display font-semibold text-[11px] md:text-xs whitespace-nowrap">הרוויחו מביקורות 💰</span>
      </div>
    </motion.button>
  );
};

export default FloatingEarnCTA;
