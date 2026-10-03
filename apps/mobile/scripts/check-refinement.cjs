/* Supplemental Expo WEB checks. These do not establish Android correctness. */
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const base = process.env.MOBILE_PREVIEW_URL || 'http://localhost:19006';
const output =
  process.env.MOBILE_QA_OUTPUT || '/tmp/revuping-mobile-refinement-qa';
const routes = [
  '/survey-editor',
  '/',
  '/welcome',
  '/login',
  '/signup',
  '/onboarding',
  '/feedback',
  '/feedback/1',
  '/customers',
  '/customers/1',
  '/customers/add',
  '/campaigns',
  '/campaigns/builder',
  '/more',
  ...[
    'qr-studio',
    'reviews',
    'surveys',
    'reports',
    'staff',
    'competitors',
    'widgets',
    'integrations',
    'settings',
    'billing',
    'profile',
    'referrals',
  ].map((s) => `/more/${s}`),
];
// Read the actual fixture totals, keeping browser expectations tied to feature meaning.
const fixtureModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('packages/mobile-data/src/lib/fixtures.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports: fixtureModule.exports },
);
const { reportRows } = fixtureModule.exports;
const errors = [];
const results = [];
const dataKey = 'revuping-mobile-demo-v1';
const themeKey = 'revuping-mobile-theme-v1';
fs.mkdirSync(output, { recursive: true });

async function scroll(page, bottom) {
  await page.waitForTimeout(240);
  await page.evaluate((toBottom) => {
    for (const el of document.querySelectorAll('div')) {
      if (
        /auto|scroll/.test(getComputedStyle(el).overflowY) &&
        el.scrollHeight > el.clientHeight + 1
      )
        el.scrollTop = toBottom ? el.scrollHeight : 0;
    }
  }, bottom);
  await page.waitForTimeout(120);
}
async function run() {
  const browser = await chromium.launch();
  try {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: 320, height: 640 },
        reducedMotion: 'no-preference',
      });
      await context.addInitScript(
        ({ key, theme }) => localStorage.setItem(key, theme),
        { key: themeKey, theme },
      );
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      const go = async (route) => {
        await page.goto(base + route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(350);
      };
      const click = async (name) =>
        page.getByRole('button', { name, exact: true }).click();
      const close = async () => {
        await page
          .getByRole('button', { name: 'Close sheet', exact: true })
          .last()
          .click();
        await page.waitForTimeout(230);
      };
      await go('/login');
      await page.getByLabel('Password', { exact: true }).fill('sample-secret');
      await click('Show password');
      await expect
        .poll(() =>
          page
            .getByLabel('Password', { exact: true })
            .evaluate((el) => el.type),
        )
        .toBe('text');
      await click('Hide password');
      await expect(
        page.getByLabel('Password', { exact: true }),
      ).toHaveAttribute('type', 'password');
      await page.getByLabel('Email', { exact: true }).fill('owner@example.com');
      await click('Open demo workspace');
      expect(
        await page.evaluate((key) => localStorage.getItem(key), dataKey),
      ).not.toContain('sample-secret');
      results.push(
        `${theme}: password reveal/login without password persistence`,
      );

      await go('/customers/add');
      await click('Save customer');
      await expect(
        page.getByText('Name is required', { exact: true }),
      ).toBeVisible();
      await page.getByLabel('Name', { exact: true }).fill('QA customer');
      await page.getByLabel('Email', { exact: true }).fill('qa@example.com');
      await click('Save customer');
      await go('/customers');
      await click('Filter: No consent');
      await expect(
        page.getByText('QA customer', { exact: true }),
      ).toBeVisible();
      const state = JSON.parse(
        await page.evaluate((key) => localStorage.getItem(key), dataKey),
      );
      const added = state.customers.find((c) => c.name === 'QA customer');
      await go(`/customers/${added.id}`);
      await expect(page.getByText('No consent', { exact: true })).toHaveCount(
        1,
      );
      await click('Preview review request');
      await expect(
        page.getByText('Consent is required before sending requests.', {
          exact: true,
        }),
      ).toBeVisible();
      await close();
      await click('Record consent');
      await click('Opt out');
      await page
        .getByRole('button', { name: 'Opt out', exact: true })
        .last()
        .click();
      await expect(page.getByText('Opted out', { exact: true })).toBeVisible();
      results.push(
        `${theme}: customer validation/save/filter/consent restrictions/preview/opt-out`,
      );

      await go('/feedback');
      await click('Feedback from Olivia Martin, 5 stars, unresolved');
      await expect(
        page.getByRole('tab', { name: 'Home tab', exact: true }),
      ).toHaveCount(0);
      await page
        .getByLabel('Private note', { exact: true })
        .fill('Follow up after the visit.');
      await click('Save note');
      await click('Priority: Normal');
      await click('High');
      await page.getByLabel('Due date', { exact: true }).fill('2026-02-30');
      await click('Save follow-up plan');
      await expect(
        page.getByText('Enter a due date and follow-up summary.', {
          exact: true,
        }),
      ).toBeVisible();
      await page.getByLabel('Due date', { exact: true }).fill('2026-10-09');
      await click('Save follow-up plan');
      await click('Resolve feedback');
      await expect(
        page.getByRole('button', { name: 'Mark unresolved', exact: true }),
      ).toBeVisible();
      await click('Mark unresolved');
      await click('Go back');
      await expect(page).toHaveURL(/\/feedback$/);
      results.push(
        `${theme}: note/priority/invalid date/save/resolve/reopen/back (text date fallback only)`,
      );

      await go('/survey-editor');
      await page
        .getByLabel('Survey name', { exact: true })
        .fill('QA visit survey');
      await click('Add question');
      await page.waitForTimeout(240);
      await page.getByLabel('Question', { exact: true }).fill('Anything else?');
      await click('Question type: Text');
      await click('Multiple choice');
      await page
        .getByLabel('Choices (one per line)', { exact: true })
        .fill('Yes\nNo');
      await click('Move question 2 up');
      await expect(
        page.getByText('Anything else? · Multiple choice · Optional', {
          exact: true,
        }),
      ).toBeVisible();
      // Rapid interrupted height/chevron transitions must preserve the parent draft.
      for (let i = 0; i < 6; i++) await click('Question 1');
      await page.waitForTimeout(250);
      await expect(page.getByLabel('Question', { exact: true })).toHaveValue(
        'Anything else?',
      );
      await click('Remove question 2');
      await click('Save survey');
      await go('/more/surveys');
      await expect(
        page.getByText('QA visit survey', { exact: true }),
      ).toBeVisible();
      results.push(
        `${theme}: survey add/type/choices/reorder/rapid toggle/remove/save`,
      );

      await go('/more/qr-studio');
      await click('Customer page preview');
      await expect(
        page.getByRole('button', {
          name: 'Write a Google review',
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: 'Share private feedback',
          exact: true,
        }),
      ).toBeVisible();
      await scroll(page, true);
      await page.screenshot({
        path: path.join(output, `${theme}-customer-page.png`),
      });
      await click('Share private feedback');
      await page
        .getByLabel('Your feedback', { exact: true })
        .fill('A sample visit.');
      await click('Preview feedback submission');
      await click('Write a Google review');
      await expect(
        page.getByText(/does not open Google or publish/),
      ).toBeVisible();
      await close();
      await page.getByLabel('Brand colour', { exact: true }).fill('#ffffff');
      await click('Save QR style');
      results.push(
        `${theme}: equal public/private choices, private preview, QR contrast fallback`,
      );

      await go('/more/reviews');
      await page
        .getByRole('button', { name: 'Edit draft', exact: true })
        .first()
        .click();
      await page
        .getByLabel('Edit reply draft', { exact: true })
        .fill('Thank you for sharing this feedback.');
      await click('Save');
      await page
        .getByRole('button', { name: 'Approve reply', exact: true })
        .first()
        .click();
      await expect(page.getByText('Approved', { exact: true })).toHaveCount(1);
      await page
        .getByRole('button', { name: 'Edit draft', exact: true })
        .first()
        .click();
      await page
        .getByLabel('Edit reply draft', { exact: true })
        .fill('A new reply needing owner approval.');
      await click('Save');
      await expect(page.getByText('Approved', { exact: true })).toHaveCount(0);
      results.push(
        `${theme}: reply edit/save/approve/revision clears approval`,
      );

      await go('/more/reports');
      await click('Date range: Last 30 days');
      await click('Last 7 days');
      const latest = Math.max(...reportRows.map((r) => Date.parse(r.date)));
      const expected = reportRows
        .filter((r) => Date.parse(r.date) > latest - 7 * 86400000)
        .reduce((n, r) => n + r.requests, 0);
      await expect(
        page.getByText(`${expected}`, { exact: true }).first(),
      ).toBeVisible();
      await click('Location: All locations');
      await click('Richmond');
      const richmondRequests = reportRows
        .filter(
          (r) =>
            r.location === 'Richmond' &&
            Date.parse(r.date) > latest - 7 * 86400000,
        )
        .reduce((n, r) => n + r.requests, 0);
      await expect(
        page.getByText(`${richmondRequests}`, { exact: true }).first(),
      ).toBeVisible();
      results.push(
        `${theme}: report totals match fixtures and date/location selection`,
      );

      await go('/campaigns/builder');
      await page
        .getByLabel('Campaign name', { exact: true })
        .fill('QA visit follow-up');
      await click('Continue');
      await click('Continue');
      await click('Continue');
      await page
        .getByLabel('Schedule date', { exact: true })
        .fill('2026-10-09');
      await page.getByLabel('Schedule time', { exact: true }).fill('11:30');
      await click('Save demo campaign');
      await go('/campaigns');
      await expect(
        page.getByText('QA visit follow-up', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Scheduled: 9 Oct 2026 · 11:30 am', { exact: true }),
      ).toBeVisible();
      await click('Filter: Reminder');
      await expect(
        page.getByText('QA visit follow-up', { exact: true }),
      ).toHaveCount(0);
      results.push(
        `${theme}: campaign eligibility, date/time save, human schedule, filter`,
      );
      await go('/more/staff');
      await click('Staff member: All staff');
      await click('Alex');
      await expect(
        page.getByText('Private feedback by staff', { exact: true }),
      ).toBeVisible();
      results.push(`${theme}: staff filter and accurate chart title`);

      await go('/more/settings');
      await click('Category: Salon & beauty');
      await click('Retail');
      await click('Opening hours');
      await page.getByLabel('Opens at', { exact: true }).fill('10:00');
      await click('Apply hours to profile');
      await click('Edit locations');
      await click('Add location');
      await page.getByLabel('Location 3', { exact: true }).fill('Chelsea');
      await click('Apply locations');
      await click('Save profile');
      await expect(
        page.getByText('Business profile saved', { exact: true }),
      ).toBeVisible();
      await page.getByLabel('Invite name', { exact: true }).fill('QA teammate');
      await page.getByLabel('Invite email', { exact: true }).fill('invalid');
      await click('Invite member');
      await expect(
        page.getByText(
          'Enter a valid email that is not already on the demo team.',
          { exact: true },
        ),
      ).toBeVisible();
      results.push(
        `${theme}: category/hours/locations/profile save/invitation validation`,
      );

      await go('/more/widgets');
      await click('Preview theme: Light');
      await click('Dark');
      await click('Layout: Review cards');
      await click('Carousel');
      await click('Preview embed code');
      await expect(
        page.getByText('Demo embed snippet', { exact: true }),
      ).toBeVisible();
      await close();
      await go('/more/referrals');
      await click('Preview invitation');
      await close();
      await click('Pause programme');
      await expect(
        page.getByText('Paused · demo', { exact: true }),
      ).toBeVisible();
      await go('/more/integrations');
      await page
        .getByRole('button', { name: 'Simulate connection', exact: true })
        .first()
        .click();
      await expect(
        page.getByText('Demo connected', { exact: true }),
      ).toHaveCount(1);
      await page
        .getByRole('button', { name: 'Disconnect demo', exact: true })
        .click();
      await go('/more/billing');
      await page
        .getByRole('button', { name: 'Select plan', exact: true })
        .first()
        .click();
      await expect(
        page.getByRole('button', { name: 'Selected · demo', exact: true }),
      ).toBeDisabled();
      results.push(
        `${theme}: widget layout/theme/code, referral preview/pause, simulated connection, demo plan`,
      );

      await go('/more/profile');
      await click('Reset demo data');
      await click('Cancel');
      await click('Reset demo data');
      await click('Reset');
      await expect(
        page.getByText('Demo data reset', { exact: true }),
      ).toBeVisible();
      await click(theme === 'light' ? 'Dark theme' : 'Light theme');
      await click('System theme');
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect
        .poll(() => page.evaluate((key) => localStorage.getItem(key), themeKey))
        .toBe('system');
      results.push(
        `${theme}: reset cancel/confirm, theme selection/system browser scheme`,
      );

      // Recreate clean fixture state per route, capture top and last content at two sizes.
      for (const width of [320, 390]) {
        await page.setViewportSize({
          width,
          height: width === 320 ? 640 : 844,
        });
        for (const route of routes) {
          await page.evaluate((key) => localStorage.removeItem(key), dataKey);
          await go(route);
          expect(
            await page.evaluate(
              () =>
                document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
          ).toBe(true);
          const name =
            route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
          await page.screenshot({
            path: path.join(output, `${theme}-${width}-${name}-top.png`),
          });
          await scroll(page, true);
          await page.screenshot({
            path: path.join(output, `${theme}-${width}-${name}-end.png`),
          });
          results.push(`${theme} ${width}: ${route} top/end, page width`);
          console.log('CAPTURE', theme, width, route);
        }
      }
      // Reduced motion: collapse removes editable controls from keyboard navigation.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await go('/survey-editor');
      await click('Question 1');
      await expect(page.getByLabel('Question', { exact: true })).toHaveCount(0);
      await click('Question 1');
      await expect(page.getByLabel('Question', { exact: true })).toBeVisible();
      // Long names/content and browser-only text stress, retaining device font limitations.
      await go('/');
      const longState = JSON.parse(
        await page.evaluate((key) => localStorage.getItem(key), dataKey),
      );
      longState.business.name = 'Bloom & Co. Notting Hill customer care studio';
      longState.feedback[0].name = 'Alexandra Montgomery-Wellington';
      longState.customers[0].name = 'Alexandra Montgomery-Wellington';
      longState.customers[0].email =
        'alexandra.montgomery.wellington@example.com';
      longState.reviews[0].text =
        'A thoughtful visit with a little room to improve the waiting time. '.repeat(
          12,
        );
      await page.evaluate(
        ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
        { key: dataKey, state: longState },
      );
      await page.setViewportSize({ width: 430, height: 932 });
      for (const route of [
        '/',
        '/feedback',
        '/customers/1',
        '/more/reviews',
        '/survey-editor',
        '/more/settings',
        '/login',
      ]) {
        await go(route);
        await page.evaluate(() => {
          for (const el of document.querySelectorAll(
            'div,span,button,input,textarea',
          )) {
            if (el.children.length) continue;
            const style = getComputedStyle(el);
            if (parseFloat(style.fontSize))
              el.style.fontSize = `${parseFloat(style.fontSize) * 1.5}px`;
            if (style.lineHeight !== 'normal')
              el.style.lineHeight = `${parseFloat(style.lineHeight) * 1.5}px`;
          }
        });
        await page.screenshot({
          path: path.join(
            output,
            `${theme}-430-stress-${route.slice(1).replaceAll('/', '-') || 'home'}.png`,
          ),
        });
      }
      await context.close();
    }
    if (errors.length) throw new Error([...new Set(errors)].join('\n'));
  } finally {
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify(
        { browserOnly: true, base, results, errors: [...new Set(errors)] },
        null,
        2,
      ),
    );
    await browser.close();
  }
  console.log(
    `PASS ${results.length} checks/captures. Android keyboard, fontScale, dialogs and system UI remain unverified.`,
  );
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
