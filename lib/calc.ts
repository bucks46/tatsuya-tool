import { plans, Plan } from "./plans";

export type RankedPlan = {
  carrier: string;
  name: string;
  price: number;
  tierLabel: string;
  coversFully: boolean;
  rank: number;
  isRakuten: boolean;
};

function getApplicablePrice(
  plan: Plan,
  usageGB: number
): { price: number; tierLabel: string; coversFully: boolean } {
  for (const tier of plan.tiers) {
    if (tier.maxGB === null || tier.maxGB >= usageGB) {
      return {
        price: tier.price,
        tierLabel: tier.maxGB === null ? "無制限" : `〜${tier.maxGB}GB`,
        coversFully: true,
      };
    }
  }
  // Usage exceeds all defined tiers — use the last one
  const last = plan.tiers[plan.tiers.length - 1];
  return {
    price: last.price,
    tierLabel: last.maxGB === null ? "無制限" : `〜${last.maxGB}GB`,
    coversFully: false,
  };
}

export function getRankedPlans(usageGB: number): RankedPlan[] {
  const result = plans.map((plan) => {
    const { price, tierLabel, coversFully } = getApplicablePrice(plan, usageGB);
    return {
      carrier: plan.carrier,
      name: plan.name,
      price,
      tierLabel,
      coversFully,
      rank: 0,
      isRakuten: plan.carrier === "楽天モバイル",
    };
  });

  result.sort((a, b) => a.price - b.price);
  result.forEach((plan, i) => {
    plan.rank = i + 1;
  });

  return result;
}

export type DiffResult = {
  monthly: number;
  yearly: number;
  threeYear: number;
};

export function calcDiff(currentMonthly: number, newMonthly: number): DiffResult {
  const monthly = currentMonthly - newMonthly;
  return {
    monthly,
    yearly: monthly * 12,
    threeYear: monthly * 36,
  };
}

export const RAKUTEN_HIKARI_PRICE = {
  mansion: 4180,
  house: 5200,
} as const;

export type HomeType = "mansion" | "house";

export type HikariCalcResult = {
  hikariPrice: number;
  freePeriod: number;
  firstYearCost: number;
  firstYearSaving: number;
  annualSaving: number;
};

export function calcRakutenHikari(
  currentMonthly: number,
  homeType: HomeType,
  withRakutenMobile: boolean
): HikariCalcResult {
  const hikariPrice = RAKUTEN_HIKARI_PRICE[homeType];
  const freePeriod = withRakutenMobile ? 6 : 0;
  const firstYearCost = hikariPrice * (12 - freePeriod);
  const currentAnnual = currentMonthly * 12;
  return {
    hikariPrice,
    freePeriod,
    firstYearCost,
    firstYearSaving: currentAnnual - firstYearCost,
    annualSaving: currentAnnual - hikariPrice * 12,
  };
}
