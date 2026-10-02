'use client';
import { useState } from 'react';
import { feedback, customers, reviews } from '@/data-access/mock-data';

/** Session-only state for the landing preview; never calls a service. */
export function usePreviewDemo() {
  const [items, setItems] = useState(feedback.slice(0, 3));
  const [selectedId, setSelectedId] = useState(2);
  const [requestId, setRequestId] = useState(1);
  const [sentIds, setSentIds] = useState<number[]>([]);
  const [draft, setDraft] = useState(reviews[0].draft);
  const [approved, setApproved] = useState(false);
  const selected = items.find((item) => item.id === selectedId) || items[0];
  const customer =
    customers.find((item) => item.id === requestId) || customers[0];
  return {
    items,
    selected,
    select: setSelectedId,
    toggleResolved: () =>
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? { ...item, resolved: !item.resolved }
            : item,
        ),
      ),
    customer,
    selectCustomer: setRequestId,
    sent: sentIds.includes(customer.id),
    simulateSend: () => {
      if (customer.consent) setSentIds((ids) => [...ids, customer.id]);
    },
    draft,
    approved,
    editDraft: (value: string) => {
      setDraft(value);
      setApproved(false);
    },
    approve: () => setApproved(true),
  };
}
