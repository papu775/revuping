/** Original vector study of the procedural stand, bubble and rings. No model or stock art. */
export function HeroStatic({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 560"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient
          id="stand-paper"
          x1="200"
          y1="100"
          x2="410"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fffdf6" />
          <stop offset="1" stopColor="#e9e3d6" />
        </linearGradient>
        <linearGradient
          id="stand-edge"
          x1="390"
          y1="110"
          x2="445"
          y2="390"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d8d0c2" />
          <stop offset="1" stopColor="#bdb4a5" />
        </linearGradient>
        <radialGradient id="stand-shadow">
          <stop stopColor="#24213f" stopOpacity=".2" />
          <stop offset="1" stopColor="#24213f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="307" cy="450" rx="220" ry="48" fill="url(#stand-shadow)" />
      <g stroke="#9875cc" strokeWidth="1.5" opacity=".3">
        <ellipse
          cx="304"
          cy="269"
          rx="216"
          ry="170"
          transform="rotate(-22 304 269)"
        />
        <ellipse
          cx="304"
          cy="269"
          rx="186"
          ry="144"
          transform="rotate(-22 304 269)"
        />
        <ellipse
          cx="304"
          cy="269"
          rx="154"
          ry="115"
          transform="rotate(-22 304 269)"
        />
      </g>
      <path
        d="m194 416 167-10 86 32q6 7-8 13l-165 16q-14 1-23-6l-61-30q-8-9 4-15Z"
        fill="#d5cbb9"
      />
      <path
        d="m194 409 167-10 84 33q9 5-7 10l-162 15q-13 1-24-5l-63-30q-9-8 5-13Z"
        fill="#f5f0e5"
      />
      <path
        d="M227 114q0-15 16-16l154 11q13 1 15 16l21 262q1 15-14 17l-155 18q-13 1-16-14Z"
        fill="url(#stand-edge)"
      />
      <path
        d="M218 117q-1-15 14-15l152 9q13 0 14 15l21 261q1 14-13 16l-154 16q-13 2-15-13Z"
        fill="url(#stand-paper)"
        stroke="#fffdf8"
        strokeWidth="2"
      />
      <path
        d="m236 138 143 9"
        stroke="#7d5abd"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="matrix(1 .055 .08 1 259 203)" fill="#7354ae">
        <path
          fillRule="evenodd"
          d="M0 0h35v35H0Zm7 7v21h21V7ZM78 0h35v35H78Zm7 7v21h21V7ZM0 78h35v35H0Zm7 7v21h21V85Z"
        />
        <path d="M12 12h11v11H12ZM90 12h11v11H90ZM12 90h11v11H12ZM45 0h10v12H45ZM57 17h11v17H57ZM43 42h18v11H43ZM70 45h10v20H70ZM92 43h21v10H92ZM0 45h23v11H0ZM12 61h20v10H12ZM43 64h12v22H43ZM60 78h21v10H60ZM92 64h10v23H92ZM104 94h9v19H104ZM77 99h16v14H77ZM43 100h17v13H43Z" />
      </g>
      <path
        d="m276 168 56 3m-60 186 86-8m-75 22 67-7"
        stroke="#8c8597"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".55"
      />
      <g transform="rotate(-7 172 175)">
        <rect x="72" y="125" width="191" height="96" rx="24" fill="#ddd6e8" />
        <rect
          x="69"
          y="119"
          width="191"
          height="96"
          rx="24"
          fill="#faf7ef"
          stroke="#e5dfd6"
        />
        <path d="m105 211-3 28 33-27" fill="#faf7ef" />
        <circle cx="98" cy="148" r="8" fill="#8c6bc3" />
        <path
          d="M119 148h101M94 177h109M94 191h74"
          stroke="#a5b7a5"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(8 445 355)">
        <rect x="365" y="311" width="171" height="86" rx="20" fill="#d4c8e2" />
        <rect
          x="362"
          y="305"
          width="171"
          height="86"
          rx="20"
          fill="#f9f5ed"
          stroke="#e1dacc"
        />
        <g fill="#8662b6">
          <path d="m387 325 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
          <path d="m413 325 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
          <path d="m439 325 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
          <path d="m465 325 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
          <path d="m491 325 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
        </g>
        <path
          d="M385 365h109"
          stroke="#b2bfae"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
