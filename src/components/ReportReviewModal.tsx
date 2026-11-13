import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import type { ModerationReport } from '../types/course';

interface ReportReviewModalProps {
  reviewId: string;
  onClose: () => void;
  onSubmitReport: (payload: {
    reviewId: string;
    reason: ModerationReport['reason'];
    details: string;
  }) => Promise<void>;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  reviewId,
  onClose,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState<ModerationReport['reason']>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitReport({ reviewId, reason, details: details.trim() });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-[var(--status-warning)]" aria-hidden="true" />
            <h2 id="report-modal-title" className="font-display text-base font-bold text-[var(--text-primary)]">
              Report Review for Moderation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            CourseGlide preserves legitimate negative criticism. Report reviews only if they
            contain spam, threats/harassment, personal identifying information, or off-topic content.
          </p>

          <div>
            <label htmlFor="rep-reason" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Reason
            </label>
            <select
              id="rep-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ModerationReport['reason'])}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
            >
              <option value="spam">Spam or duplicate submission</option>
              <option value="harassment">Threats, harassment, or personal attacks</option>
              <option value="pii">Contains personal contact / student ID information</option>
              <option value="off_topic">Completely off-topic / promotional</option>
            </select>
          </div>

          <div>
            <label htmlFor="rep-details" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Additional context (optional)
            </label>
            <textarea
              id="rep-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly explain what moderation rule applies..."
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-xs font-semibold text-[var(--surface)] hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
