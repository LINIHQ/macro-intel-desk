const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Svg({ children }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CATEGORY_ICONS = {
  global_liquidity: (
    <Svg>
      <circle cx="8" cy="8" r="6" {...P} />
      <path d="M2 8h12M8 2c-2.2 2-2.2 10 0 12M8 2c2.2 2 2.2 10 0 12" {...P} />
    </Svg>
  ),
  yen_carry_trade: (
    <Svg>
      <path d="M4 2l4 5 4-5M8 7v7M5 9.2h6M5 11.6h6" {...P} />
    </Svg>
  ),
  oil_shock_risk: (
    <Svg>
      <path d="M8 2C8 2 3.5 7.5 3.5 10.3a4.5 4.5 0 0 0 9 0C12.5 7.5 8 2 8 2Z" {...P} />
    </Svg>
  ),
  hormuz_risk: (
    <Svg>
      <path d="M2 11h12l-1.5 3h-9L2 11Z" {...P} />
      <path d="M8 11V4M8 4l4 3H8" {...P} />
    </Svg>
  ),
  global_risk_appetite: (
    <Svg>
      <path d="M2.5 11.5a5.5 5.5 0 0 1 11 0" {...P} />
      <path d="M8 11.5L11 7.5" {...P} />
    </Svg>
  ),
  bond_market_stress: (
    <Svg>
      <path d="M2 4l4 4.5L8.5 6 14 11" {...P} />
      <path d="M10.8 11H14V7.8" {...P} />
    </Svg>
  ),
  xrp_fundamentals: (
    <Svg>
      <path d="M3 3l3.2 3.2a2.5 2.5 0 0 0 3.6 0L13 3M3 13l3.2-3.2a2.5 2.5 0 0 1 3.6 0L13 13" {...P} />
    </Svg>
  ),
  xrp_macro_environment: (
    <Svg>
      <path d="M8 2.5L14.5 13h-13L8 2.5Z" {...P} />
      <path d="M8 6.8v3M8 11.6v.4" {...P} />
    </Svg>
  ),
};
