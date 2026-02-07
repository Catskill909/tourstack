/**
 * Unsaved Changes Guard Store
 *
 * Zustand store that allows pages to register unsaved changes.
 * The Sidebar checks this before navigating away.
 */

import { create } from 'zustand';

interface UnsavedChangesState {
    isDirty: boolean;
    setDirty: (dirty: boolean) => void;
}

export const useUnsavedChangesStore = create<UnsavedChangesState>((set) => ({
    isDirty: false,
    setDirty: (dirty: boolean) => set({ isDirty: dirty }),
}));
