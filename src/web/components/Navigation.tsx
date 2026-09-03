import React from 'react';
import type { GuardedTaskSyncResult } from '../../types';
import ThemeToggle from './ThemeToggle';

interface NavigationProps {
    projectName: string;
    onSync: () => Promise<void>;
    syncResult?: GuardedTaskSyncResult | null;
    syncError?: string | null;
    isSyncPending?: boolean;
}

function getSyncTone(status: GuardedTaskSyncResult["status"] | undefined, hasError: boolean): string {
    if (hasError || status === "failed") {
        return "text-red-700 dark:text-red-400";
    }
    if (status === "up-to-date" || status === "fast-forwarded") {
        return "text-emerald-700 dark:text-emerald-400";
    }
    if (
        status === "local-changes" ||
        status === "ahead" ||
        status === "diverged" ||
        status === "no-upstream" ||
        status === "checkout-changed" ||
        status === "busy"
    ) {
        return "text-amber-700 dark:text-amber-400";
    }
    return "text-gray-500 dark:text-gray-400";
}

const Navigation: React.FC<NavigationProps> = ({ projectName, onSync, syncResult, syncError, isSyncPending = false }) => {
    const syncMessage = syncError ?? syncResult?.message;
    const syncTone = getSyncTone(syncResult?.status, syncError !== null && syncError !== undefined);

    return (
        <nav className="px-8 h-18 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-200">
            <div className="h-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{projectName || 'Loading...'}</h1>
                    <span className="text-sm text-gray-500 dark:text-gray-400">powered by</span>
                    <a
                        href="https://backlog.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 hover:underline transition-colors duration-200"
                    >
                        Backlog.md
                    </a>
                </div>
                <div className="flex items-center gap-3">
                    {syncMessage && (
                        <span className={`text-sm ${syncTone}`} role="status" aria-live="polite">
                            {syncMessage}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => void onSync()}
                        disabled={isSyncPending}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        {isSyncPending ? 'Syncing…' : 'Sync'}
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
};

export default Navigation;