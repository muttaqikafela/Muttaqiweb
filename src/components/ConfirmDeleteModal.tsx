import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const ConfirmDeleteModal: React.FC = () => {
  const { confirmDialog, closeConfirm } = useAdmin();

  if (!confirmDialog || !confirmDialog.isOpen) return null;

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    closeConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border-2 border-rose-300">
        <button
          onClick={closeConfirm}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              {confirmDialog.title || 'মুছে ফেলার নিশ্চিতকরণ'}
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {confirmDialog.message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmDialog.confirmText || 'হ্যাঁ, মুছে ফেলুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
