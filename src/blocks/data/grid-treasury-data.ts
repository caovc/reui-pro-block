export type TreasuryLine = { id: string; name: string; actual: number[]; plan: number[]; badge?: number; note?: string; category?: string; score?: number; children?: TreasuryLine[] }

// Values transcribed from the rendered public treasury preview, independently composed.
export const treasurySeed: TreasuryLine[] = [
  {
    "id": "cash",
    "name": "Cash",
    "category": "Liquidity",
    "score": 85,
    "actual": [
      243000,
      181000,
      121000,
      62000,
      245000
    ],
    "plan": [
      248000,
      196000,
      144000,
      92000,
      188000
    ],
    "children": [
      {
        "id": "opening-cash-balance-carryover",
        "name": "Opening Cash Balance Carryover",
        "badge": -16,
        "note": "Watch. Jul 2026 landed 16% below plan.",
        "actual": [
          290000,
          243000,
          181000,
          121000,
          62000
        ],
        "plan": [
          295000,
          248000,
          197000,
          144000,
          72000
        ]
      },
      {
        "id": "operating-cash-movement-impact",
        "name": "Operating Cash Movement Impact",
        "badge": 56,
        "note": "Timing. Aug 2026 spend came in 56% under plan. This looks more like timing than durable savings.",
        "actual": [
          -47000,
          -62000,
          -60000,
          -93000,
          -15000
        ],
        "plan": [
          -47000,
          -52000,
          -53000,
          -70000,
          -34000
        ]
      },
      {
        "id": "capital-inflow-event-timing",
        "name": "Capital Inflow Event Timing",
        "badge": 89,
        "note": "Spike. Jul 2026 landed 89% above plan. This reads more like a one-off spike than steady improvement.",
        "actual": [
          0,
          0,
          0,
          34000,
          198000
        ],
        "plan": [
          0,
          0,
          0,
          18000,
          150000
        ]
      }
    ]
  },
  {
    "id": "burn",
    "name": "Burn",
    "category": "Operating",
    "score": 77,
    "actual": [
      -47000,
      -62000,
      -60000,
      -93000,
      -15000
    ],
    "plan": [
      -47000,
      -52000,
      -53000,
      -70000,
      -34000
    ],
    "children": [
      {
        "id": "customer-cash-collection-pace",
        "name": "Customer Cash Collection Pace",
        "badge": -18,
        "note": "Watch. May 2026 landed 18% below plan.",
        "actual": [
          72000,
          64000,
          82000,
          91000,
          118000
        ],
        "plan": [
          75000,
          78000,
          85000,
          96000,
          110000
        ]
      },
      {
        "id": "operating-cash-outflow-load",
        "name": "Operating Cash Outflow Load",
        "badge": -11,
        "note": "Critical. Jul 2026 spend ran 11% over plan.",
        "actual": [
          -119000,
          -126000,
          -142000,
          -184000,
          -133000
        ],
        "plan": [
          -122000,
          -130000,
          -138000,
          -166000,
          -144000
        ]
      }
    ]
  },
  {
    "id": "income",
    "name": "Income",
    "category": "Revenue",
    "score": 88,
    "actual": [
      72000,
      64000,
      82000,
      91000,
      118000
    ],
    "plan": [
      75000,
      78000,
      85000,
      96000,
      110000
    ],
    "children": [
      {
        "id": "recurring-subscription-revenue-base",
        "name": "Recurring Subscription Revenue Base",
        "badge": 10,
        "note": "Favorable. Aug 2026 landed 10% above plan.",
        "actual": [
          48000,
          46000,
          54000,
          58000,
          79000
        ],
        "plan": [
          50000,
          49000,
          52000,
          58000,
          72000
        ]
      },
      {
        "id": "implementation-services-revenue-stream",
        "name": "Implementation Services Revenue Stream",
        "badge": -23,
        "note": "Critical. May 2026 landed 23% below plan.",
        "actual": [
          14000,
          10000,
          12000,
          16000,
          21000
        ],
        "plan": [
          15000,
          13000,
          14000,
          16000,
          19000
        ]
      },
      {
        "id": "expansion-deal-collections-timing",
        "name": "Expansion Deal Collections Timing",
        "badge": -50,
        "note": "Critical. May 2026 landed 50% below plan.",
        "actual": [
          10000,
          8000,
          16000,
          17000,
          18000
        ],
        "plan": [
          10000,
          16000,
          19000,
          22000,
          19000
        ]
      }
    ]
  },
  {
    "id": "expenses",
    "name": "Expenses",
    "category": "Operating",
    "score": 88,
    "actual": [
      -119000,
      -126000,
      -142000,
      -184000,
      -133000
    ],
    "plan": [
      -122000,
      -130000,
      -138000,
      -166000,
      -144000
    ],
    "children": [
      {
        "id": "core-team-payroll-load",
        "name": "Core Team Payroll Load",
        "badge": -5,
        "note": "Stable. Jul 2026 stayed within 5% of plan.",
        "actual": [
          -68000,
          -72000,
          -79000,
          -84000,
          -86000
        ],
        "plan": [
          -69000,
          -71000,
          -76000,
          -80000,
          -82000
        ]
      },
      {
        "id": "cloud-infrastructure-spend-load",
        "name": "Cloud Infrastructure Spend Load",
        "badge": -13,
        "note": "Critical. Jul 2026 spend ran 13% over plan.",
        "actual": [
          -18000,
          -19000,
          -23000,
          -34000,
          -19000
        ],
        "plan": [
          -19000,
          -20000,
          -22000,
          -30000,
          -21000
        ]
      },
      {
        "id": "sales-program-spend-mix",
        "name": "Sales Program Spend Mix",
        "badge": 38,
        "note": "Favorable. Aug 2026 spend landed 38% under plan.",
        "actual": [
          -21000,
          -24000,
          -28000,
          -42000,
          -18000
        ],
        "plan": [
          -23000,
          -26000,
          -28000,
          -36000,
          -29000
        ]
      },
      {
        "id": "g-a-compliance-spend-load",
        "name": "G&A Compliance Spend Load",
        "badge": -20,
        "note": "Critical. Jul 2026 spend ran 20% over plan.",
        "actual": [
          -12000,
          -11000,
          -12000,
          -24000,
          -10000
        ],
        "plan": [
          -11000,
          -13000,
          -12000,
          -20000,
          -12000
        ]
      }
    ]
  },
  {
    "id": "funding",
    "name": "Funding",
    "category": "Funding",
    "score": 62,
    "actual": [
      0,
      0,
      0,
      34000,
      198000
    ],
    "plan": [
      0,
      0,
      0,
      18000,
      150000
    ],
    "children": [
      {
        "id": "venture-debt-drawdown-timing",
        "name": "Venture Debt Drawdown Timing",
        "badge": 33,
        "note": "Favorable. Aug 2026 landed 33% above plan.",
        "actual": [
          0,
          0,
          0,
          0,
          160000
        ],
        "plan": [
          0,
          0,
          0,
          0,
          120000
        ]
      },
      {
        "id": "partner-channel-prepayment-timing",
        "name": "Partner Channel Prepayment Timing",
        "badge": 33,
        "note": "Favorable. Aug 2026 landed 33% above plan.",
        "actual": [
          0,
          0,
          0,
          22000,
          24000
        ],
        "plan": [
          0,
          0,
          0,
          18000,
          18000
        ]
      },
      {
        "id": "r-d-tax-credit-timing",
        "name": "R&D Tax Credit Timing",
        "badge": 17,
        "note": "Favorable. Aug 2026 landed 17% above plan.",
        "actual": [
          0,
          0,
          0,
          12000,
          14000
        ],
        "plan": [
          0,
          0,
          0,
          0,
          12000
        ]
      }
    ]
  }
]
