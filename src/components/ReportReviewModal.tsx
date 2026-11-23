import React, { useState } from 'react';
import { X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
    >
      <div className="w-full max-w-md rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-dialog overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-6 py-4">
          <h2 id="report-modal-title" className="type-body font-semibold text-[var(--text)]">
            Report Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="type-caption text-[var(--text-muted)]">
            Negative feedback is welcome. Report only spam, harassment, personal information, or
            off-topic content.
          </p>

          <div>
            <label htmlFor="rep-reason" className="block type-caption font-semibold text-[var(--text)] mb-1">
              Reason
            </label>
            <select
              id="rep-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ModerationReport['reason'])}
              className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 type-small text-[var(--text)] focus:border-[var(--accent-strong)]"
            >
              <option value="spam">Spam or duplicate submission</option>
              <option value="harassment">Threats, harassment, or personal attacks</option>
              <option value="pii">Contains personal contact / student ID information</option>
              <option value="off_topic">Completely off-topic / promotional</option>
            </select>
          </div>

          <div>
            <label htmlFor="rep-details" className="block type-caption font-semibold text-[var(--text)] mb-1">
              Details (optional)
            </label>
            <textarea
              id="rep-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly explain the issue..."
              className="w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 type-small text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary inline-flex min-h-[44px] items-center rounded-control px-4 py-2 type-caption font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex min-h-[44px] items-center rounded-control px-4 py-2 type-caption font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
