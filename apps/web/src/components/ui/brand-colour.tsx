'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, Pipette } from 'lucide-react';

export const brandColourPresets = ['#6250b5', '#253c39', '#243650', '#ad5e41'];
export function BrandColour({
  label,
  value,
  onChange,
  pickerLabel = 'Choose custom colour',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  pickerLabel?: string;
}) {
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);
  const [error, setError] = useState(false);
  useEffect(() => {
    setText(value);
    setError(false);
  }, [value]);
  function edit(next: string) {
    setText(next);
    const valid = /^#[0-9a-f]{6}$/i.test(next);
    setError(!valid);
    if (valid) onChange(next.toLowerCase());
  }
  return (
    <div className="my-5 min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className={`flex min-h-12 items-center gap-3 rounded-lg border bg-input px-3 focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-accent ${error ? 'border-danger' : 'border-control'}`}
      >
        <span
          aria-hidden="true"
          className="size-7 shrink-0 rounded-md border border-control shadow-sm"
          style={{ backgroundColor: value }}
        />
        <input
          id={id}
          className="min-w-0 flex-1 bg-transparent py-3 font-mono text-sm uppercase text-ink !outline-none max-md:text-base"
          value={text}
          onChange={(event) => edit(event.target.value)}
          maxLength={7}
          spellCheck={false}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <div className="relative size-10 shrink-0">
          <input
            ref={picker}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={pickerLabel}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none flex size-full items-center justify-center rounded-md border border-line bg-soft text-ink"
          >
            <Pipette size={18} />
          </span>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-danger">
          Use a six-digit hex colour, such as #6250B5.
        </p>
      )}
      <div className="mt-3 flex gap-2" aria-label={`${label} presets`}>
        {brandColourPresets.map((colour) => (
          <button
            key={colour}
            type="button"
            aria-label={`Select colour ${colour}`}
            aria-pressed={value.toLowerCase() === colour}
            onClick={() => onChange(colour)}
            className="flex size-9 items-center justify-center rounded-full border border-control text-white ring-offset-2 ring-offset-surface aria-pressed:ring-2 aria-pressed:ring-accent focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent"
            style={{ backgroundColor: colour }}
          >
            {value.toLowerCase() === colour && <Check size={17} />}
          </button>
        ))}
      </div>
    </div>
  );
}
