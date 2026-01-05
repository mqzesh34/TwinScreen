import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  variant?: "danger" | "purple" | "blue";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Onayla",
  cancelText = "Vazgeç",
  icon,
  variant = "danger",
}: ConfirmModalProps) {
  const variants = {
    danger: {
      bg: "bg-red-500/10",
      text: "text-red-500",
      border: "border-red-500/20",
      button:
        "bg-red-500/10 active:bg-red-500/20 text-red-500 border-red-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      border: "border-purple-500/20",
      button:
        "bg-purple-500/10 active:bg-purple-500/20 text-purple-500 border-purple-500/20",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
      button:
        "bg-blue-500/10 active:bg-blue-500/20 text-blue-500 border-blue-500/20",
    },
  };

  const activeVariant = variants[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#121212] p-6 rounded-3xl w-full max-w-sm border border-white/10 space-y-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full ${activeVariant.bg} flex items-center justify-center mx-auto mb-4`}
              >
                {icon || (
                  <AlertCircle size={32} className={activeVariant.text} />
                )}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {title}
              </h3>
              <p className="text-white/40 text-sm px-4 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 p-4 bg-white/5 border border-white/5 text-white/60 rounded-2xl font-bold transition-all hover:bg-white/10"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 p-4 border rounded-2xl font-bold transition-all shadow-lg ${activeVariant.button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
