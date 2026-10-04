/** Original local artwork: a storefront connected to messages and brand waves. */
export function BrandScene({ backdrop = false }: { backdrop?: boolean }) {
  return (
    <div
      className={backdrop ? 'brand-backdrop' : 'brand-scene'}
      aria-hidden="true"
    >
      <svg viewBox="0 0 600 420" fill="none" focusable="false">
        <ellipse
          cx="310"
          cy="230"
          rx="240"
          ry="160"
          fill="currentColor"
          opacity=".06"
        />
        <g stroke="currentColor" opacity=".2">
          <ellipse cx="310" cy="230" rx="265" ry="175" strokeDasharray="3 9" />
          <path d="M30 310C130 390 210 60 390 115S520 290 590 180M15 330C155 410 225 80 390 135S535 310 600 200" />
          <path d="M80 70h32m-16-16v32M500 330h24m-12-12v24" />
        </g>
        <g fill="var(--scene-paper)" stroke="currentColor" strokeWidth="2">
          <rect x="170" y="160" width="258" height="184" rx="18" />
          <path d="M159 165l30-55h220l30 55z" fill="var(--scene-tint)" />
          <path d="M159 165v18c0 24 40 24 40 0v-18m0 0v18c0 24 40 24 40 0v-18m0 0v18c0 24 40 24 40 0v-18m0 0v18c0 24 40 24 40 0v-18m0 0v18c0 24 40 24 40 0v-18m0 0v18c0 24 40 24 40 0v-18" />
          <rect
            x="201"
            y="231"
            width="91"
            height="75"
            rx="8"
            fill="var(--scene-tint)"
          />
          <rect x="317" y="223" width="76" height="121" rx="8" />
          <circle cx="377" cy="287" r="3" fill="currentColor" />
          <rect x="385" y="51" width="148" height="93" rx="16" />
          <path d="M404 76l52 31 57-31M407 122h52" opacity=".6" />
          <rect x="62" y="226" width="136" height="91" rx="16" />
          <path d="M86 251h89m-89 16h65m-65 16h40" opacity=".5" />
        </g>
        <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M222 265v12m12-23v34m12-44v54m12-43v32m12-21v12" />
        </g>
        <g fill="currentColor" opacity=".3">
          <circle cx="122" cy="143" r="5" />
          <circle cx="472" cy="264" r="7" />
          <circle cx="331" cy="71" r="3" />
          <circle cx="94" cy="362" r="3" />
        </g>
      </svg>
    </div>
  );
}
