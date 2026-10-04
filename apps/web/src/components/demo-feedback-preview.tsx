import { MessageSquare, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Stars } from '@/components/shared';
import { feedback } from '@/data-access/mock-data';

/** The existing James fixture, shown only as an explicitly fictional preview. */
export function DemoFeedbackPreview({
  compact = false,
}: {
  compact?: boolean;
}) {
  const sample = feedback[1];
  return (
    <div
      className={`auth-product-card demo-feedback-preview ${compact ? 'is-compact' : ''}`}
    >
      <div className="auth-card-label">
        <MessageSquare size={15} /> Fictional demo feedback
      </div>
      <div className="auth-card-person">
        <Avatar
          name={sample.name}
          demoPortrait
          size={compact ? 'small' : 'default'}
        />
        <strong>{compact ? 'James' : sample.name}</strong>
        <Stars rating={sample.rating} />
      </div>
      <p>“{compact ? 'A little heads-up would have helped.' : sample.text}”</p>
      {!compact && (
        <div className="auth-card-note">
          <ArrowRight size={16} /> Review privately, then follow up
        </div>
      )}
    </div>
  );
}
