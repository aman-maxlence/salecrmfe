export function MaxSalesMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 174 94"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ aspectRatio: '23/12' }}
    >
      <g filter="url(#mark-shadow)">
        <path
          d="M10 79.0124L42.0546 24.0329L48.0029 29.9589L24.5402 70.7819H34.7845L63.8649 21.7284L86.6667 44.7737L106.494 25.0206L103.851 22.0576L121.034 16.1317L115.086 32.9218L112.773 29.9589L86.6667 56.2963L65.1868 34.8971L39.4109 79.0124H10Z"
          fill="#03071E"
        />
        <path
          d="M63.204 56.2963L67.1695 49.3827L86.6667 68.8066L131.609 24.3622L163.333 79.0124H133.922L121.365 57.6132L127.644 51.6873L138.549 70.7819H148.793L129.296 37.2017L86.6667 80L63.204 56.2963Z"
          fill="#03071E"
        />
      </g>
      <defs>
        <filter id="mark-shadow" x="0" y="10.1317" width="173.333" height="83.8683" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0117647 0 0 0 0 0.0156863 0 0 0 0 0.368627 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_630_166" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_630_166" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}
