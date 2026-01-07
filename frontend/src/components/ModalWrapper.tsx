import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  position?: "center" | "top";
}

export default function ModalWrapper({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  position = "center",
}: ModalWrapperProps) {
  const containerClasses =
    position === "center"
      ? "flex items-center justify-center p-4"
      : "flex items-start justify-center pt-24 px-4";

  const initialY = position === "center" ? 20 : -20;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[100] ${containerClasses}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: initialY }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: initialY }}
            className={`relative w-full border border-white/10 shadow-2xl overflow-hidden ${className}`}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors p-1 z-50"
              >
                <X size={20} />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
