import React from 'react';
import { CheckCircle2, LogOut, User, X } from 'lucide-react';
import type { Course, DemoUser } from '../types/course';

interface ProfileModalProps {
  currentUser: DemoUser | null;
  savedCourses: Course[];
  onClose: () => void;
  onSignInDemo: () => void;
  onSignOut: () => void;
  onOpenCourse: (courseId: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  savedCourses,
  onClose,
  onSignInDemo,
  onSignOut,
  onOpenCourse,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
    >
      <div className="w-full max-w-md rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-dialog overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-6 py-4">
          <h2 id="profile-modal-title" className="type-body font-semibold text-[var(--text)]">
            {currentUser ? 'Student Profile (Demo Mode)' : 'Sign In to CourseGlide'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 type-caption text-[var(--text-muted)]">
            <div className="font-semibold text-[var(--text)] mb-1">
              Labeled Demonstration Authentication
            </div>
            Firebase Google Sign-In is not provisioned in this preview session. You can sign in as a
            demonstration student profile to test saved courses, helpfulness voting, and review
            submissions persisted by the CourseGlide server.
          </div>

          {currentUser ? (
            <div className="space-y-4">
              <div className="rounded-control border border-[var(--border)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="type-small font-semibold text-[var(--text)]">
                      {currentUser.name}
                    </div>
                    <div className="type-caption text-[var(--text-muted)]">{currentUser.email}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 type-caption font-medium text-[var(--text)]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Demo Active</span>
                  </span>
                </div>
                <div className="mt-2 type-caption text-[var(--text-muted)]">{currentUser.program}</div>
              </div>

              <div>
                <div className="type-caption font-semibold text-[var(--text)] mb-2">
                  Saved Courses ({savedCourses.length})
                </div>
                {savedCourses.length === 0 ? (
                  <p className="type-caption text-[var(--text-muted)]">No saved courses yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)] rounded-control border border-[var(--border)]">
                    {savedCourses.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenCourse(c.id);
                            onClose();
                          }}
                          className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left type-caption hover:bg-[var(--surface-2)]"
                        >
                          <span>
                            <strong className="mr-2 font-semibold text-[var(--text)] tabular-nums">{c.code}</strong>
                            <span className="text-[var(--text)]">{c.title}</span>
                          </span>
                          <span className="text-[var(--text-muted)]">Open</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 type-caption font-semibold"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign Out Demo Session</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onSignInDemo}
                className="btn-primary flex min-h-[44px] w-full items-center justify-center gap-2 rounded-control px-4 py-2 type-small font-semibold shadow-surface"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>Continue as Demo Student</span>
              </button>
              <p className="text-center type-caption text-[var(--text-muted)]">
                Uses local session demo account without real university credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
