'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { initialProduct, type ProductState } from '../lib/product-data';
import { feedback, customers, reviews } from '../lib/mock-data';

function useWorkspaceState() {
  const [product, setProduct] = useState<ProductState>(initialProduct);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('revuping-demo-preferences-v1');
      if (raw && raw.length < 3000) {
        const saved = JSON.parse(raw);
        const notifications = saved.notifications;
        const validNotifications =
          notifications &&
          ['weekly', 'feedback', 'reminders'].every(
            (key) => typeof notifications[key] === 'boolean',
          );
        const widget = saved.widget;
        const validWidget =
          widget &&
          ['Compact badge', 'Review cards', 'Carousel', 'Review wall'].includes(
            widget.layout,
          ) &&
          ['Light', 'Dark'].includes(widget.theme) &&
          /^#[0-9a-f]{6}$/i.test(widget.colour) &&
          Array.isArray(widget.reviewIds) &&
          widget.reviewIds.every((id: unknown) =>
            reviews.some((review) => review.id === id),
          );
        setProduct((previous) => ({
          ...previous,
          notifications: validNotifications
            ? notifications
            : previous.notifications,
          widget: validWidget ? widget : previous.widget,
        }));
      }
    } catch {
      /* Optional display preferences never prevent the demo from loading. */
    }
    setPreferencesLoaded(true);
  }, []);
  useEffect(() => {
    if (!preferencesLoaded) return;
    try {
      localStorage.setItem(
        'revuping-demo-preferences-v1',
        JSON.stringify({
          notifications: product.notifications,
          widget: product.widget,
        }),
      );
    } catch {
      /* In-memory flows remain usable when storage is unavailable. */
    }
  }, [preferencesLoaded, product.notifications, product.widget]);
  function updateProduct(
    update: Partial<ProductState> | ((previous: ProductState) => ProductState),
  ) {
    setProduct((previous) =>
      typeof update === 'function'
        ? update(previous)
        : { ...previous, ...update },
    );
  }
  function resetDemo() {
    setFeedbackItems(feedback);
    setNotes({});
    setCustomerItems(customers);
    setDrafts(
      Object.fromEntries(reviews.map((review) => [review.id, review.draft])),
    );
    setApproved([]);
    setProduct(initialProduct);
  }
  const [feedbackItems, setFeedbackItems] = useState(feedback);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [customerItems, setCustomerItems] = useState(customers);
  const [drafts, setDrafts] = useState<Record<number, string>>(
    Object.fromEntries(reviews.map((review) => [review.id, review.draft])),
  );
  const [approved, setApproved] = useState<number[]>([]);
  return {
    product,
    updateProduct,
    resetDemo,
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
/** Session data stays in memory. Only non-sensitive display preferences persist locally. */
export function DemoWorkspace({ children }: { children: React.ReactNode }) {
  const state = useWorkspaceState();
  return <Workspace.Provider value={state}>{children}</Workspace.Provider>;
}
export function useDemoWorkspace() {
  const state = useContext(Workspace);
  if (!state) throw new Error('DemoWorkspace provider is required');
  return state;
}
