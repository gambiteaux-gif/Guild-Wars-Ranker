import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, error, confirmLabel = 'Confirm', onCancel, onConfirm, busy = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded border border-gold/25 bg-[#111820] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded border border-blood/50 bg-blood/20 text-red-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl text-gold">{title}</p>
              <p className="mt-1 text-sm text-stone-300">{message}</p>
            </div>
          </div>
          <button type="button" className="icon-button h-9 w-9" onClick={onCancel} title="Close" disabled={busy}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {error && (
            <p className="mr-auto max-w-[16rem] text-sm text-red-200">
              {error}
            </p>
          )}
          <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="button-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
