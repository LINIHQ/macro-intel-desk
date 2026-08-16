const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Svg({ children }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CATEGORY_ICONS = {
  global_liquidity: (
    <Svg>
      <rect x="2" y="9" width="3" height="5" fill="currentColor" />
      <rect x="6.5" y="6" width="3" height="8" fill="currentColor" />
      <rect x="11" y="2.5" width="3" height="11.5" fill="currentColor" />
    </Svg>
  ),
  yen_carry_trade: (
    <Svg>
      <path d="M4 2l4 5 4-5M8 7v7M4.8 9.3h6.4M4.8 11.8h6.4" {...S} strokeWidth="2.1" />
    </Svg>
  ),
  oil_shock_risk: (
    <Svg>
      <path d="M8 1.5C8 1.5 3.2 7.3 3.2 10.2a4.8 4.8 0 0 0 9.6 0C12.8 7.3 8 1.5 8 1.5Z" fill="currentColor" />
    </Svg>
  ),
  hormuz_risk: (
    <Svg>
      <path d="M8 1.5l5.5 2v4.2c0 3.3-2.3 5.7-5.5 6.8-3.2-1.1-5.5-3.5-5.5-6.8V3.5L8 1.5Z" fill="currentColor" />
      <path d="M8 4.8v3.6M8 10.8v.4" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Svg>
  ),
  global_risk_appetite: (
    <Svg>
      <path d="M2.5 11.5a5.5 5.5 0 0 1 11 0" {...S} strokeWidth="2.1" />
      <path d="M8 11.5l3.2-4.2" {...S} strokeWidth="2.1" />
      <circle cx="8" cy="11.5" r="1.4" fill="currentColor" />
    </Svg>
  ),
  bond_market_stress: (
    <Svg>
      <path d="M8 1.8L15 13.6H1L8 1.8Z" fill="currentColor" />
      <path d="M8 6.2v3.4M8 11.6v.3" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Svg>
  ),
  xrp_fundamentals: (
    <Svg>
      <path d="M1.5 8.5h3l1.8-4 3.4 7.5 1.8-3.5h3" {...S} strokeWidth="2.1" />
    </Svg>
  ),
  xrp_macro_environment: (
    <Svg>
      <circle cx="8" cy="8" r="6.2" {...S} />
      <path d="M1.8 8h12.4M8 1.8c-2.3 2-2.3 10.4 0 12.4M8 1.8c2.3 2 2.3 10.4 0 12.4" {...S} strokeWidth="1.6" />
    </Svg>
  ),
};
