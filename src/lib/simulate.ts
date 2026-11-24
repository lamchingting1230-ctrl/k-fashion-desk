import { weekCap, meanVisits } from "./pricing";

/** Seeded RNG (mulberry32) for reproducible practice seasons */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number): number {
  // Box-Muller
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export type WeekDemand = {
  week: number;
  visits: number;
  /** WTP list per SKU (interested customers who prefer that SKU) */
  wtp: [number[], number[], number[]];
};

export function generateSeason(seed = Date.now() % 1e9): WeekDemand[] {
  const rng = mulberry32(seed);
  const season: WeekDemand[] = [];

  for (let week = 1; week <= 12; week++) {
    const mu = meanVisits(week);
    const sigma = week <= 8 ? 200 : 400;
    const visits = Math.max(0, Math.round(mu + sigma * randn(rng)));
    const cap = weekCap(week);
    const wtp: [number[], number[], number[]] = [[], [], []];

    for (let i = 0; i < visits; i++) {
      // Interest with prob 1/50
      if (rng() >= 1 / 50) continue;
      // Prefer one SKU with equal prob
      const sku = Math.floor(rng() * 3) as 0 | 1 | 2;
      const val = rng() * cap; // Uniform[0, cap)
      wtp[sku].push(val);
    }

    season.push({ week, visits, wtp });
  }
  return season;
}

export function playPrice(
  demand: WeekDemand,
  price: number,
  inv: [number, number, number]
): {
  sales: [number, number, number];
  revenue: number;
  newInv: [number, number, number];
} {
  const sales: [number, number, number] = [0, 0, 0];
  let revenue = 0;
  const left: [number, number, number] = [...inv];

  for (let s = 0; s < 3; s++) {
    for (const w of demand.wtp[s]) {
      if (left[s] <= 0) break;
      if (w >= price) {
        left[s] -= 1;
        sales[s] += 1;
        revenue += price;
      }
    }
  }

  return { sales, revenue, newInv: left };
}

/** Hindsight perfect-information price for one week given fixed future value = 0
 *  (simple one-shot optimise; good enough for practice comparison) */
export function hindsightPrice(
  demand: WeekDemand,
  inv: [number, number, number]
): number {
  const cap = weekCap(demand.week);
  let bestP = 0;
  let bestRev = -1;

  for (let p = 0; p <= Math.ceil(cap); p += 5) {
    const { revenue } = playPrice(demand, p, inv);
    if (revenue > bestRev) {
      bestRev = revenue;
      bestP = p;
    }
  }
  // Fine search around best
  for (let p = Math.max(0, bestP - 10); p <= bestP + 10; p++) {
    const { revenue } = playPrice(demand, p, inv);
    if (revenue > bestRev) {
      bestRev = revenue;
      bestP = p;
    }
  }
  return bestP;
}
