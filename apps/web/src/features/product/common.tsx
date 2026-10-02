'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Download, Search } from 'lucide-react';
import { PageHeading } from '@/components/ui/page-heading';
import { Panel as SharedPanel, Badge, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
export { Badge, Field, Button, Select, Link, PageHeading };
export function Panel({
  className = '',
  ...props
}: React.ComponentProps<typeof SharedPanel>) {
  return <SharedPanel className={`product-panel ${className}`} {...props} />;
}
export function DemoBanner({ children }: { children?: React.ReactNode }) {
  return (
    <details className="demo-context mb-6 text-[13px] leading-6 text-muted">
      <summary className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent">
        <CheckCircle2 size={16} className="text-positive-ink" />
        Demo data · No live messages or connections
        <span className="ml-1 text-accent">Details</span>
      </summary>
      <p className="mt-2 max-w-[760px] border-l-2 border-line pl-6">
        {children || 'Changes stay in this demo and reset on reload.'}
      </p>
    </details>
  );
}
export function FilterToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="filter-toolbar my-6 flex flex-wrap items-end gap-4 [&>*]:min-w-[min(100%,200px)] [&>*]:flex-1 [&>.field]:!m-0">
      {children}
    </div>
  );
}
export function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <Field as="div">
      <span>{label}</span>
      <Select
        label={label}
        value={value}
        onValueChange={(value) => {
          const option = options.find((option) => option === value);
          if (option !== undefined) onChange(option);
        }}
        options={options.map((value) => ({ value, label: value }))}
        className="w-full"
      />
    </Field>
  );
}
export function SearchBox({
  label = 'Search',
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-ink">
      <label htmlFor={id}>{label}</label>
      <div className="search-field">
        <Search size={18} />
        <input
          id={id}
          aria-label={label}
          placeholder={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function MetricCards({
  items,
}: {
  items: { label: string; value: string | number; detail?: string }[];
}) {
  return (
    <div className="product-metrics">
      {items.map((item) => (
        <Panel key={item.label} className="product-metric">
          <span>{item.label}</span>
          <strong
            className={
              typeof item.value === 'string' && item.value.length > 10
                ? 'metric-text'
                : undefined
            }
          >
            {item.value}
          </strong>
          <small>{item.detail || 'Sample data'}</small>
        </Panel>
      ))}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Search size={28} />
      <h3>{title}</h3>
      <p>{children || 'Try another filter or create a sample item.'}</p>
    </div>
  );
}
export function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="product-action-link">
      <span>{children}</span>
      <ArrowRight size={17} />
    </Link>
  );
}
export function ErrorText({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p className="error-note" role="alert" id={id}>
      {children}
    </p>
  );
}
export function SampleTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  caption: string;
}) {
  return (
    <div className="table-scroll product-table">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) => (
                <td key={column} data-label={headers[column]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty title="No matching records" />}
    </div>
  );
}
export function SampleChart({
  title,
  rows,
  unit = 'responses',
}: {
  title: string;
  rows: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="sample-chart" aria-label={title}>
      <h3>{title}</h3>
      <p className="field-help">Sample {unit} · Hover or focus for values.</p>
      {!rows.length && (
        <p className="my-6 rounded-lg border border-line bg-soft p-4 text-sm">
          No sample data in this selection.
        </p>
      )}
      {!!rows.length && rows.every((row) => row.value === 0) && (
        <p className="my-4 text-sm text-muted">No sample responses yet.</p>
      )}
      {rows.some((row) => row.value > 0) && (
        <div className="chart-scale" aria-hidden="true">
          <span>{unit}</span>
          <div className="flex justify-between">
            <span>0</span>
            <span>{Math.round(max / 2)}</span>
            <span>{max}</span>
          </div>
        </div>
      )}
      <div className="sample-chart-bars">
        {rows.map((row) => (
          <div className="chart-bar-row" key={row.label}>
            <span>{row.label}</span>
            <button
              type="button"
              title={`${row.label}: ${row.value} ${unit}`}
              aria-label={`${row.label}: ${row.value} ${unit}`}
              style={
                {
                  '--bar-width': `${row.value === 0 ? 0 : Math.max(2, (row.value / max) * 100)}%`,
                } as React.CSSProperties
              }
            >
              <i aria-hidden="true" />
              <strong>{row.value}</strong>
            </button>
          </div>
        ))}
      </div>
      <details className="data-alternative">
        <summary>View chart data</summary>
        <SampleTable
          caption={`${title} · sample ${unit}`}
          headers={['Label', unit]}
          rows={rows.map((row) => [row.label, row.value])}
        />
      </details>
    </section>
  );
}
export function fileDownload(
  content: string,
  filename: string,
  type = 'text/csv;charset=utf-8',
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const csvCell = (value: unknown) =>
  `"${String(value).replaceAll('"', '""')}"`;
export function ExportButton({
  filename,
  content,
  type,
}: {
  filename: string;
  content: () => string;
  type?: string;
}) {
  const toast = useToast();
  const [error, setError] = useState(false);
  function download() {
    try {
      fileDownload(content(), filename, type);
      setError(false);
      toast('Sample file downloaded');
    } catch {
      setError(true);
      toast('Export could not be prepared', 'error');
    }
  }
  return (
    <div>
      <Button variant="secondary" onClick={download}>
        <Download size={17} />
        {error ? 'Retry export' : 'Export sample file'}
      </Button>
      {error && (
        <ErrorText>Export failed. Use Retry export to try again.</ErrorText>
      )}
    </div>
  );
}
