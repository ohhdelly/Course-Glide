import React from 'react';
import { Bookmark, CheckCircle2, LogOut, Shield, User, X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#F8FAFD] px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <h2 id="profile-modal-title" className="font-display text-base font-bold text-slate-900">
              {currentUser ? 'Student Profile (Demo Mode)' : 'Sign In to CourseGlide'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-xl border border-blue-200/65 bg-[#F4F8FD] p-3.5 text-xs leading-relaxed text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <Shield className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <span>Labeled Demonstration Authentication</span>
            </div>
            Firebase Google Sign-In is not provisioned in this preview session. You can sign in as a
            demonstration student profile to test saved courses, helpfulness voting, and review
            submissions persisted by the CourseGlide server.
          </div>

          {currentUser ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-sm font-bold text-slate-900">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-slate-500">{currentUser.email}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Demo Active</span>
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600">{currentUser.program}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
                  <Bookmark className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span>Saved Courses ({savedCourses.length})</span>
                </div>
                {savedCourses.length === 0 ? (
                  <p className="text-xs text-slate-500">No saved courses yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {savedCourses.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenCourse(c.id);
                            onClose();
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                        >
                          <span>
                            <strong className="font-mono text-blue-700 mr-1.5">{c.code}</strong>
                            <span className="text-slate-800">{c.title}</span>
                          </span>
                          <span className="text-slate-400">Open</span>
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sign Out Demo Session</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onSignInDemo}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>Continue as Demo Student</span>
              </button>
              <p className="text-center text-[11px] text-slate-500">
                Uses local session demo account without real university credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
