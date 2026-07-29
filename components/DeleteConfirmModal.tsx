'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  itemName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  description = 'Are you sure you want to permanently delete this item? This action cannot be undone.',
  itemName,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm();
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Glassmorphism */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => !deleting && onClose()}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Glowing top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
        
        {/* Close Icon Button */}
        <button
          onClick={() => !deleting && onClose()}
          disabled={deleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 flex items-center justify-center shrink-0 shadow-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 space-y-1.5 pr-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
            {itemName && (
              <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate">
                {itemName}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
