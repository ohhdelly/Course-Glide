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
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#F8FAFD] px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-700" aria-hidden="true" />
            <h2 id="report-modal-title" className="font-display text-base font-bold text-slate-900">
              Report Review for Moderation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            CourseGlide preserves legitimate negative criticism. Report reviews only if they
            contain spam, threats/harassment, personal identifying information, or off-topic content.
          </p>

          <div>
            <label htmlFor="rep-reason" className="block text-xs font-semibold text-slate-800 mb-1">
              Reason
            </label>
            <select
              id="rep-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ModerationReport['reason'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="spam">Spam or duplicate submission</option>
              <option value="harassment">Threats, harassment, or personal attacks</option>
              <option value="pii">Contains personal contact / student ID information</option>
              <option value="off_topic">Completely off-topic / promotional</option>
            </select>
          </div>

          <div>
            <label htmlFor="rep-details" className="block text-xs font-semibold text-slate-800 mb-1">
              Additional context (optional)
            </label>
            <textarea
              id="rep-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly explain what moderation rule applies..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
