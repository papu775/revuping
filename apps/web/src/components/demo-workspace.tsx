'use client';
import { createContext, useContext, useState } from 'react';
import { feedback, customers, reviews } from '../lib/mock-data';

function useWorkspaceState() {
  const [feedbackItems, setFeedbackItems] = useState(feedback);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [customerItems, setCustomerItems] = useState(customers);
  const [drafts, setDrafts] = useState<Record<number, string>>(
    Object.fromEntries(reviews.map((review) => [review.id, review.draft])),
  );
  const [approved, setApproved] = useState<number[]>([]);
  return {
    feedbackItems,
    addedFeedbackCount: feedbackItems.length - feedback.length,
    setFeedbackItems,
    notes,
    setNotes,
    customerItems,
    setCustomerItems,
    drafts,
    setDrafts,
    approved,
    setApproved,
  };
}
const Workspace = createContext<ReturnType<typeof useWorkspaceState> | null>(
  null,
);
/** Memory only: survives app navigation, resets on reload, never transmits data. */
export function DemoWorkspace({ children }: { children: React.ReactNode }) {
  const state = useWorkspaceState();
  return <Workspace.Provider value={state}>{children}</Workspace.Provider>;
}
export function useDemoWorkspace() {
  const state = useContext(Workspace);
  if (!state) throw new Error('DemoWorkspace provider is required');
  return state;
}
