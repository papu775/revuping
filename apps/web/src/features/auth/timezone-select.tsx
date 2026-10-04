'use client';
import { useId, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { supportedTimezones, timezoneLabel } from 'api-contracts';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export function TimezoneSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (zone: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const id = useId();
  const options = useMemo(
    () =>
      supportedTimezones(value).filter((zone) =>
        timezoneLabel(zone).toLowerCase().includes(search.toLowerCase()),
      ),
    [value, search],
  );
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="timezone-trigger"
        aria-label="Timezone"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setSearch('');
          setActive(0);
          setOpen(true);
        }}
      >
        <span>{timezoneLabel(value)}</span>
        <ChevronDown size={16} />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Choose timezone"
        description="Search a city or region, then select its timezone."
      >
        <input
          className="timezone-search"
          aria-label="Search timezones"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={id}
          aria-activedescendant={
            options[active] ? `${id}-${active}` : undefined
          }
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const next = Math.max(
                0,
                Math.min(
                  options.length - 1,
                  active + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              );
              setActive(next);
              document
                .getElementById(`${id}-${next}`)
                ?.scrollIntoView({ block: 'nearest' });
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (options[active]) {
                onChange(options[active]);
                setOpen(false);
              }
            }
          }}
        />
        <div
          className="timezone-options"
          id={id}
          role="listbox"
          aria-label="Supported timezones"
        >
          {options.map((zone, index) => (
            <button
              type="button"
              role="option"
              aria-selected={zone === value}
              id={`${id}-${index}`}
              key={zone}
              className={
                index === active
                  ? 'timezone-option is-active'
                  : 'timezone-option'
              }
              onClick={() => {
                onChange(zone);
                setOpen(false);
              }}
            >
              <span>{timezoneLabel(zone)}</span>
              {zone === value && <Check size={16} />}
            </button>
          ))}
          {!options.length && (
            <p role="status">No matching timezone. Try a city or region.</p>
          )}
        </div>
      </Dialog>
    </>
  );
}
