/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import { StorefrontLayout } from './components/StorefrontViews';
import { AdminAuthGate } from './components/AdminAuthGate';

const AppRouter: React.FC = () => {
  const { currentPage, toasts, dismissToast } = useStore();

  return (
    <>
      {currentPage === 'admin' ? <AdminAuthGate /> : <StorefrontLayout />}

      {/* Global Toast Notification Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 border shadow-lg flex items-start justify-between gap-3 text-xs ${
                t.type === 'error'
                  ? 'bg-red-950 text-white border-red-800'
                  : 'bg-[#111111] text-[#FAF9F6] border-neutral-700'
              }`}
            >
              <div>
                <p className="font-mono uppercase tracking-wider font-semibold">{t.title}</p>
                <p className="opacity-85 mt-0.5 leading-relaxed">{t.message}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(t.id)}
                className="opacity-70 hover:opacity-100 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}
