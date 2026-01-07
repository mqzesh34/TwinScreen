import { AlertCircle } from "lucide-react";
import React from "react";
import ModalWrapper from "./ModalWrapper";

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
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      className="bg-[#121212] p-6 rounded-3xl max-w-sm space-y-6"
    >
      <div className="text-center space-y-3 pt-4">
        <div
          className={`w-16 h-16 rounded-full ${activeVariant.bg} flex items-center justify-center mx-auto mb-4`}
        >
          {icon || <AlertCircle size={32} className={activeVariant.text} />}
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
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
    </ModalWrapper>
  );
}
