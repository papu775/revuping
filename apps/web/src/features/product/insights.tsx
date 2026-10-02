'use client';
import { useState } from 'react';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
import {
  staffMembers,
  followUpFor,
  profileFor,
  reportRows,
  demoDate,
} from '@/data-access/product-data';
import {
  Panel,
  Badge,
  Button,
  PageHeading,
  FilterToolbar,
  Picker,
  SampleTable,
  SampleChart,
  DemoBanner,
  MetricCards,
  ActionLink,
  ExportButton,
  csvCell,
} from '@/features/product/common';
export function StaffInsights() {
  const { feedbackItems, product, customerItems } = useDemoWorkspace();
  const [staff, setStaff] = useState('All staff');
  const [service, setService] = useState('All services');
  const [compare, setCompare] = useState(false);
  const visible = staffMembers.filter(
    (member) =>
      (staff === 'All staff' || member.name === staff) &&
      (service === 'All services' || member.service === service),
  );
  const summary = visible.map((member) => {
    const items = feedbackItems.filter((item) => item.staff === member.name);
    const assigned = feedbackItems.filter(
      (item) =>
        !item.resolved &&
        (product.followUps[item.id] || followUpFor(item.id, item.resolved))
          .assignee === member.name,
    );
    return {
      ...member,
      items,
      assigned,
      average: items.length
        ? (
            items.reduce((sum, item) => sum + item.rating, 0) / items.length
          ).toFixed(1)
        : '—',
    };
  });
  return (
    <>
      <PageHeading
        eyebrow="Coaching, with context"
        title="Staff & service insights"
        text="Understand sample feedback themes and plan a thoughtful follow-up. Small samples are never used as a performance ranking."
      >
        <Button variant="secondary" onClick={() => setCompare(!compare)}>
          {compare ? 'Show staff profiles' : 'Compare staff samples'}
        </Button>
      </PageHeading>
      <DemoBanner>
        Counts and distributions derive from the shared fictional feedback
        inbox. Assignment changes appear here immediately.
      </DemoBanner>
      <FilterToolbar>
        <Picker
          label="Staff member"
          value={staff}
          onChange={setStaff}
          options={['All staff', ...staffMembers.map((member) => member.name)]}
        />
        <Picker
          label="Service category"
          value={service}
          onChange={setService}
          options={['All services', 'Colour', 'Cut & finish', 'Treatments']}
        />
      </FilterToolbar>
      {compare ? (
        <Panel>
          <h2>Sample comparison, alphabetically</h2>
          <SampleTable
            caption="Coaching view · not a leaderboard"
            headers={[
              'Staff',
              'Average / 5',
              'Sample size',
              'Assigned open issues',
              'Context',
            ]}
            rows={summary.map((member) => [
              member.name,
              member.average,
              `${member.items.length} feedback responses`,
              member.assigned.length,
              member.items.length < 5
                ? 'Small sample. Avoid drawing conclusions.'
                : 'Review themes alongside the numbers.',
            ])}
          />
          <SampleChart
            title="Feedback sample sizes by staff"
            rows={summary.map((member) => ({
              label: member.name,
              value: member.items.length,
            }))}
          />
        </Panel>
      ) : (
        <div className="product-card-grid">
          {summary.map((member) => (
            <Panel key={member.name}>
              <span className="eyebrow">{member.role}</span>
              <h2>{member.name}</h2>
              <p>{member.service}</p>
              <div className="staff-average">
                <strong>
                  {member.average}
                  <small> / 5</small>
                </strong>
                <span>{member.items.length} feedback responses</span>
              </div>
              <Badge>Small illustrative sample</Badge>
              <SampleChart
                title="Rating distribution"
                unit="responses"
                rows={[5, 4, 3, 2, 1].map((rating) => ({
                  label: `${rating} stars`,
                  value: member.items.filter((item) => item.rating === rating)
                    .length,
                }))}
              />
              <h3>Coaching conversation</h3>
              <p>
                {member.theme}. Use the individual comments to understand the
                visit, rather than ranking staff.
              </p>
              <h3>Assigned unresolved issues ({member.assigned.length})</h3>
              {member.assigned.map((item) => (
                <ActionLink
                  key={item.id}
                  href={`/dashboard/feedback?item=${item.id}`}
                >
                  {item.name} ·{' '}
                  {
                    (product.followUps[item.id] || followUpFor(item.id))
                      .priority
                  }{' '}
                  priority
                </ActionLink>
              ))}
              {!member.assigned.length && (
                <p>No assigned open issues in this demo.</p>
              )}
            </Panel>
          ))}
        </div>
      )}
      <Panel>
        <h2>Recent feedback trend</h2>
        <p>
          Shared sample responses grouped by demo date for the selected staff.
          These are small sample counts, not a performance score.
        </p>
        <SampleChart
          title="Feedback by demo date"
          rows={['2026-10-01', '2026-10-02'].map((date) => ({
            label: date,
            value: feedbackItems.filter(
              (item) =>
                (item.date.startsWith('Today')
                  ? '2026-10-02'
                  : '2026-10-01') === date &&
                summary.some((member) => member.name === item.staff),
            ).length,
          }))}
          unit="responses"
        />
      </Panel>
      <Panel>
        <h2>Service feedback summary</h2>
        <SampleTable
          caption="Sample service categories, inferred from matching fictional visits"
          headers={[
            'Service',
            'Visits',
            'Feedback samples',
            'Average / 5',
            'Common theme',
          ]}
          rows={['Colour', 'Cut & finish', 'Treatments']
            .filter(
              (category) => service === 'All services' || service === category,
            )
            .map((category) => {
              const customers = customerItems.filter(
                (customer) =>
                  (product.profiles[customer.id] || profileFor(customer.id))
                    .service === category,
              );
              const samples = feedbackItems.filter((item) =>
                customers.some((customer) => customer.name === item.name),
              );
              return [
                category,
                customers.length,
                feedbackItems.filter((item) =>
                  customers.some((customer) => customer.name === item.name),
                ).length,
                samples.length
                  ? `${(samples.reduce((sum, item) => sum + item.rating, 0) / samples.length).toFixed(1)} · small sample`
                  : 'No samples',
                staffMembers.find((member) => member.service === category)
                  ?.theme || 'Listening',
              ];
            })}
        />
      </Panel>
    </>
  );
}
export function Reports() {
  const { product, feedbackItems, approved, updateProduct } =
    useDemoWorkspace();
  const [range, setRange] = useState('Last 30 days');
  const location = product.location;
  const setLocation = (location: string) => updateProduct({ location });
  const [metric, setMetric] = useState('Requests');
  const [weekly, setWeekly] = useState(false);
  const rows = reportRows.filter(
    (row) =>
      (location === 'All locations' || row.location === location) &&
      (range === 'Last 30 days' || row.date >= '2026-09-26'),
  );
  const sum = (key: 'requests' | 'clicks' | 'feedback' | 'reviews') =>
    rows.reduce((total, row) => total + row[key], 0);
  const metricKeys: Record<
    string,
    'requests' | 'clicks' | 'feedback' | 'reviews'
  > = {
    Requests: 'requests',
    'Link clicks': 'clicks',
    'Private feedback': 'feedback',
    'Confirmed sample reviews': 'reviews',
  };
  const key = metricKeys[metric] || 'requests';
  const trend = [...new Set(rows.map((row) => row.date))].map((date) => ({
    label: date.slice(5),
    value: rows
      .filter((row) => row.date === date)
      .reduce((total, row) => total + row[key], 0),
  }));
  return (
    <>
      <PageHeading
        eyebrow="Sample owner reporting"
        title="Reports"
        text="See activity, response times and service breakdowns without confusing clicks with reviews."
      >
        <ExportButton
          filename="revuping-sample-report.csv"
          content={() =>
            [
              [
                'Date',
                'Location',
                'Request previews',
                'Link clicks',
                'Private feedback',
                'Confirmed sample reviews',
                'Reply hours',
                'Resolution hours',
              ]
                .map(csvCell)
                .join(','),
              ...rows.map((row) => Object.values(row).map(csvCell).join(',')),
            ].join('\n')
          }
        />
      </PageHeading>
      <DemoBanner>
        All report points are fixed fictional fixtures as of {demoDate}. Filters
        change this sample dataset; the live-session counters below are shown
        separately.
      </DemoBanner>
      <FilterToolbar>
        <Picker
          label="Report date range"
          value={range}
          onChange={setRange}
          options={['Last 7 days', 'Last 30 days']}
        />
        <Picker
          label="Report location"
          value={location}
          onChange={setLocation}
          options={['All locations', 'Notting Hill', 'Richmond']}
        />
        <Picker
          label="Trend metric"
          value={metric}
          onChange={setMetric}
          options={[
            'Requests',
            'Link clicks',
            'Private feedback',
            'Confirmed sample reviews',
          ]}
        />
      </FilterToolbar>
      <MetricCards
        items={[
          {
            label: 'Request previews',
            value: sum('requests'),
            detail: 'Fictional outreach volume',
          },
          {
            label: 'Review-link clicks',
            value: sum('clicks'),
            detail: 'Does not confirm a review',
          },
          {
            label: 'Private feedback',
            value: sum('feedback'),
            detail: 'Fictional direct responses',
          },
          {
            label: 'Confirmed sample reviews',
            value: sum('reviews'),
            detail: 'Fictional confirmed-review fixture',
          },
        ]}
      />
      <div className="product-split">
        <Panel>
          <SampleChart
            title={`${metric} trend`}
            rows={trend}
            unit={metric.toLowerCase()}
          />
          <p className="field-help">
            Legend: violet bars show {metric.toLowerCase()}; every value is a
            sample.
          </p>
        </Panel>
        <Panel className="product-detail">
          <h2>Reply & resolution turnaround</h2>
          <MetricCards
            items={[
              {
                label: 'Mean reply time',
                value: `${(rows.reduce((sum, row) => sum + row.replyHours, 0) / Math.max(rows.length, 1)).toFixed(1)} h`,
                detail: `${rows.length} fictional reporting periods`,
              },
              {
                label: 'Mean complaint resolution',
                value: `${(rows.reduce((sum, row) => sum + row.resolutionHours, 0) / Math.max(rows.length, 1)).toFixed(1)} h`,
                detail: 'Fixture averages, not measured in this app',
              },
            ]}
          />
          <h3>Current demo session</h3>
          <p>
            {feedbackItems.filter((item) => !item.resolved).length} unresolved
            feedback items · {approved.length} reply drafts approved in the
            demo.
          </p>
          <Button variant="secondary" onClick={() => setWeekly(!weekly)}>
            {weekly ? 'Close weekly summary' : 'Preview weekly owner summary'}
          </Button>
          {weekly && (
            <div className="product-message">
              <strong>Your fictional week at {location}</strong>
              <p>
                {sum('requests')} request previews, {sum('clicks')} link clicks
                and {sum('feedback')} private feedback responses in the selected
                date range. Review count is separately modelled:{' '}
                {sum('reviews')}.
              </p>
              <p>
                Coaching focus: appointment communication. No email was sent.
              </p>
            </div>
          )}
        </Panel>
      </div>
      <Panel>
        <h2>Staff and service breakdown</h2>
        <SampleTable
          caption="Current shared feedback samples · independent of historical report fixtures"
          headers={['Staff', 'Service', 'Feedback samples', 'Open issues']}
          rows={staffMembers.map((member) => [
            member.name,
            member.service,
            feedbackItems.filter((item) => item.staff === member.name).length,
            feedbackItems.filter(
              (item) =>
                !item.resolved &&
                (product.followUps[item.id] || followUpFor(item.id))
                  .assignee === member.name,
            ).length,
          ])}
        />
        <ActionLink href="/dashboard/staff">
          Explore staff and service details
        </ActionLink>
      </Panel>
    </>
  );
}
export function Competitors() {
  const [selected, setSelected] = useState([
    'Willow Studio',
    'The Violet Room',
  ]);
  const [range, setRange] = useState('October sample');
  const samples = [
    {
      name: 'Willow Studio',
      rating: range === 'October sample' ? 4.6 : 4.5,
      count: range === 'October sample' ? 84 : 76,
      theme: 'Appointment clarity',
    },
    {
      name: 'The Violet Room',
      rating: range === 'October sample' ? 4.4 : 4.3,
      count: range === 'October sample' ? 62 : 55,
      theme: 'Comfort and friendliness',
    },
    {
      name: 'Sage & Scissors',
      rating: range === 'October sample' ? 4.7 : 4.6,
      count: range === 'October sample' ? 103 : 98,
      theme: 'Consultations',
    },
  ];
  const visible = samples.filter((sample) => selected.includes(sample.name));
  return (
    <>
      <PageHeading
        eyebrow="Simulated nearby-business research"
        title="Competitor comparison"
        text="Explore how a comparison screen could support business planning. These businesses and their reviews are fictional."
      />
      <DemoBanner>
        No scraping or external review access. Source: RevuPing fictional
        fixtures. Last sample update: 2 October 2026.
      </DemoBanner>
      <div className="product-split">
        <Panel>
          <h2>Comparison set</h2>
          {samples.map((sample) => (
            <label key={sample.name} className="consent-checkbox">
              <input
                type="checkbox"
                checked={selected.includes(sample.name)}
                onChange={(event) =>
                  setSelected(
                    event.target.checked
                      ? [...selected, sample.name]
                      : selected.filter((name) => name !== sample.name),
                  )
                }
              />
              <span>
                {sample.name}
                <small>Fictional business</small>
              </span>
            </label>
          ))}
          <Picker
            label="Comparison period"
            value={range}
            onChange={setRange}
            options={['September sample', 'October sample']}
          />
          <p className="field-help">
            Compare trends for context, never infer causation from rating
            differences.
          </p>
        </Panel>
        <Panel>
          <SampleChart
            title="Sample review counts"
            rows={visible.map((sample) => ({
              label: sample.name,
              value: sample.count,
            }))}
            unit="fictional reviews"
          />
        </Panel>
      </div>
      <Panel>
        <h2>Ratings and themes</h2>
        <SampleTable
          caption={`${range} · simulated source data`}
          headers={[
            'Business',
            'Sample rating',
            'Sample review count',
            'Review theme',
            'Source',
          ]}
          rows={visible.map((sample) => [
            sample.name,
            `${sample.rating} / 5`,
            sample.count,
            sample.theme,
            'Fictional fixture · 2026-10-02',
          ])}
        />
      </Panel>
    </>
  );
}
