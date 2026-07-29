'use client';

import { useState } from 'react';
import { UserX, X, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface InactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { date: string }) => Promise<void>;
  employeeName: string;
}

export default function InactivateModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
}: InactivateModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({ date });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Inactivation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden transform animate-in zoom-in-95 duration-200 space-y-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        <button
          onClick={() => !submitting && onClose()}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-xs text-amber-600 dark:text-amber-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">Deactivate Personnel Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Change status for <span className="font-semibold text-slate-800 dark:text-slate-200">{employeeName}</span> to Inactive.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Effective Deactivation Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                required
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            Note: This will set the employee record status to <strong>Inactive</strong>. It will not create a resignation entry.
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Mark as Inactive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

