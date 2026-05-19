export default function AnimatedJeepLogo() {
  return (
    <div className="aj">
      <svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
        {/* Sun */}
        <g>
          <circle className="acc-fill acc-glow" cx="265" cy="58" r="9" />
          <circle className="acc-stroke" cx="265" cy="58" r="16" opacity="0.5" />
        </g>

        {/* Mountains */}
        <g className="mountains">
          <path className="stroke-faint" d="M -10 260 L 40 220 L 80 240 L 130 200 L 180 230 L 230 200 L 280 240 L 320 215 L 370 260 Z" />
          <path className="stroke-thin"  d="M -10 270 L 30 245 L 70 260 L 110 230 L 150 255 L 190 235 L 240 265 L 290 240 L 340 270 L 370 270 Z" />
        </g>

        {/* Ground */}
        <line className="stroke-thin" x1="0" y1="270" x2="360" y2="270" />
        <g className="ground-ticks">
          {[...Array(24)].map((_, i) => (
            <line key={i} className="stroke-faint" x1={-20 + i * 20} y1="270" x2={-20 + i * 20} y2="276" />
          ))}
        </g>

        {/* Dust puffs */}
        <g>
          <circle className="dust"        cx="120" cy="262" r="4" />
          <circle className="dust dust-2" cx="120" cy="262" r="3" />
          <circle className="dust dust-3" cx="120" cy="262" r="3.5" />
          <circle className="dust dust-4" cx="120" cy="262" r="2.5" />
        </g>

        {/* Jeep body */}
        <g className="jeep">
          <path className="stroke" d="
            M 95 240 L 95 230 L 100 220 L 100 175
            L 115 175 L 115 165 L 200 165 L 215 175
            L 245 175 L 260 200 L 280 200 L 280 215
            L 286 215 L 286 240 L 270 240
          "/>
          <path className="stroke" d="M 145 240 L 230 240" />
          <path className="stroke" d="M 105 240 L 105 244" />
          <path className="stroke" d="M 280 240 L 280 244" />

          <line className="stroke-thin" x1="120" y1="170" x2="200" y2="170" />
          <line className="stroke-thin" x1="125" y1="166" x2="125" y2="172" />
          <line className="stroke-thin" x1="195" y1="166" x2="195" y2="172" />

          <line className="stroke-thin" x1="155" y1="178" x2="155" y2="220" />
          <line className="stroke-thin" x1="200" y1="178" x2="200" y2="220" />

          <rect className="stroke-thin" x="120" y="180" width="32" height="20" rx="2" />
          <rect className="stroke-thin" x="158" y="180" width="40" height="20" rx="2" />
          <line className="stroke-thin" x1="203" y1="178" x2="217" y2="200" />
          <line className="stroke-thin" x1="217" y1="200" x2="260" y2="200" />
          <line className="stroke-thin" x1="252" y1="200" x2="252" y2="215" />

          <line className="stroke" x1="135" y1="208" x2="143" y2="208" />
          <line className="stroke" x1="170" y1="208" x2="178" y2="208" />

          <g className="stroke-thin">
            <line x1="263" y1="206" x2="263" y2="215" />
            <line x1="267" y1="206" x2="267" y2="215" />
            <line x1="271" y1="206" x2="271" y2="215" />
            <line x1="275" y1="206" x2="275" y2="215" />
            <line x1="279" y1="206" x2="279" y2="215" />
          </g>
          <rect className="stroke" x="259" y="203" width="24" height="14" rx="2" />
          <circle className="acc-fill acc-glow" cx="282" cy="210" r="3" />

          <path className="stroke" d="M 100 240 A 22 22 0 0 1 145 240" />
          <path className="stroke" d="M 230 240 A 22 22 0 0 1 275 240" />

          {/* Rear wheel */}
          <g>
            <circle className="stroke ink-fill" cx="122" cy="244" r="20" />
            <g className="wheel-rim">
              <circle className="stroke-thin" cx="122" cy="244" r="8" />
              <line className="stroke-thin" x1="122" y1="228" x2="122" y2="260" />
              <line className="stroke-thin" x1="106" y1="244" x2="138" y2="244" />
              <line className="stroke-thin" x1="111" y1="233" x2="133" y2="255" />
              <line className="stroke-thin" x1="133" y1="233" x2="111" y2="255" />
            </g>
            <circle className="acc-fill" cx="122" cy="244" r="2" />
          </g>

          {/* Front wheel */}
          <g>
            <circle className="stroke ink-fill" cx="253" cy="244" r="20" />
            <g className="wheel-rim">
              <circle className="stroke-thin" cx="253" cy="244" r="8" />
              <line className="stroke-thin" x1="253" y1="228" x2="253" y2="260" />
              <line className="stroke-thin" x1="237" y1="244" x2="269" y2="244" />
              <line className="stroke-thin" x1="242" y1="233" x2="264" y2="255" />
              <line className="stroke-thin" x1="264" y1="233" x2="242" y2="255" />
            </g>
            <circle className="acc-fill" cx="253" cy="244" r="2" />
          </g>
        </g>

        {/* Fishing rod + line + fish */}
        <g className="rod">
          <path className="stroke" d="M 60 232 Q 140 60 320 80" strokeWidth="2.4" />
          <circle className="stroke ink-fill" cx="70" cy="226" r="6" />
          <line  className="stroke-thin" x1="64" y1="222" x2="68" y2="226" />
          <line  className="stroke" x1="55" y1="234" x2="50" y2="244" strokeWidth="3" />

          <circle className="acc-fill" cx="100" cy="170" r="1.6" />
          <circle className="acc-fill" cx="140" cy="125" r="1.6" />
          <circle className="acc-fill" cx="190" cy="98"  r="1.6" />
          <circle className="acc-fill" cx="245" cy="83"  r="1.6" />
          <circle className="acc-fill" cx="300" cy="80"  r="1.6" />
          <circle className="acc-fill acc-glow" cx="320" cy="80" r="2.4" />

          <g className="line-fish">
            <path className="stroke-thin" d="M 320 80 C 320 130 330 175 335 215" />
            <path className="stroke-thin" d="M 335 215 q 4 3 1 6 q -2 1 -3 -1" />
            <g className="fish">
              <path className="acc-fill" d="M 326 222 Q 335 214 346 222 Q 335 230 326 222 Z" />
              <path className="acc-fill" d="M 346 222 L 354 216 L 352 222 L 354 228 Z" />
              <circle className="ink-fill" cx="330" cy="220" r="0.9" />
            </g>
            <g className="fish-splash">
              <circle className="acc-stroke" cx="338" cy="225" r="6" opacity="0.7" />
            </g>
          </g>
        </g>
      </svg>

      <span className="aj-tag">
        <span className="acc">[</span> JEEPROD <span className="acc">·</span> JP <span className="acc">]</span>
      </span>
    </div>
  )
}
