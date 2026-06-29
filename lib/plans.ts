export type PriceTier = {
  maxGB: number | null; // null = unlimited
  price: number;
};

export type Plan = {
  carrier: string;
  name: string;
  tiers: PriceTier[];
};

export const CARRIER_LIST = [
  "楽天モバイル",
  "ahamo",
  "povo",
  "LINEMO",
  "UQモバイル",
  "docomo eximo",
  "au使い放題MAX 5G",
  "SoftBankメリハリ無制限",
  "その他",
] as const;

export type CarrierName = (typeof CARRIER_LIST)[number];

export const plans: Plan[] = [
  {
    carrier: "楽天モバイル",
    name: "最強プラン",
    tiers: [
      { maxGB: 3, price: 1078 },
      { maxGB: 20, price: 2178 },
      { maxGB: null, price: 3278 },
    ],
  },
  {
    carrier: "ahamo",
    name: "ahamo",
    tiers: [{ maxGB: 20, price: 2970 }],
  },
  {
    carrier: "povo",
    name: "povo2.0",
    tiers: [
      { maxGB: 3, price: 990 },
      { maxGB: 20, price: 2700 },
    ],
  },
  {
    carrier: "LINEMO",
    name: "LINEMO",
    tiers: [
      { maxGB: 3, price: 990 },
      { maxGB: 20, price: 2728 },
    ],
  },
  {
    carrier: "UQモバイル",
    name: "トクトクプラン",
    tiers: [{ maxGB: 15, price: 3278 }],
  },
  {
    carrier: "docomo eximo",
    name: "eximo",
    tiers: [{ maxGB: null, price: 7315 }],
  },
  {
    carrier: "au使い放題MAX 5G",
    name: "使い放題MAX 5G",
    tiers: [{ maxGB: null, price: 7238 }],
  },
  {
    carrier: "SoftBankメリハリ無制限",
    name: "メリハリ無制限",
    tiers: [{ maxGB: null, price: 7238 }],
  },
];
