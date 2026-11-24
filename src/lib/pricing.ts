/** K-Fashion case parameters (IIMT3636) */

export function weekCap(week: number): number {
  // WTP ~ Uniform[0, 1000 - 4*(t-1)^2]
  return Math.max(0, 1000 - 4 * (week - 1) ** 2);
}

export function meanVisits(week: number): number {
  // Weeks 1–8: N(800,200); Weeks 9–12: N(1600,400)
  return week <= 8 ? 800 : 1600;
}

/** Expected interested customers per SKU for the week */
export function expectedInterested(week: number): number {
  return meanVisits(week) / 150;
}

/**
 * Inventory-aware price recommendation.
 * Searches integer prices and maximises expected this-week revenue
 * plus a simple continuation value (scarcity / time left).
 */
export function recommendPrice(
  week: number,
  inv: [number, number, number]
): {
  price: number;
  band: [number, number];
  cap: number;
  why: string;
  expectedSales: number;
  expectedRevenue: number;
} {
  const cap = weekCap(week);
  const remainingWeeks = 13 - week;
  const totalInv = inv[0] + inv[1] + inv[2];

  if (totalInv === 0 || week > 12) {
    return {
      price: 0,
      band: [0, 0],
      cap,
      why: "No stock left — price is irrelevant.",
      expectedSales: 0,
      expectedRevenue: 0,
    };
  }

  const mu = expectedInterested(week); // per SKU
  // Target sell-through this week: don't dump everything early
  const targetPerSku = inv.map((q) => Math.min(q, q / remainingWeeks + 0.35));

  let bestP = Math.round(cap * 0.75);
  let bestScore = -Infinity;
  let bestSales = 0;
  let bestRev = 0;
  const scores: { p: number; score: number }[] = [];

  // Search prices from ~40% to 95% of cap in steps of 5
  const lo = Math.max(0, Math.floor(cap * 0.35));
  const hi = Math.max(lo, Math.floor(cap * 0.95));

  for (let p = lo; p <= hi; p += 5) {
    // Buy probability under Uniform[0,cap]: (cap-p)/cap if p < cap
    const buyProb = p >= cap ? 0 : (cap - p) / cap;

    let weekRev = 0;
    let weekSales = 0;
    let leftoverValue = 0;

    for (let s = 0; s < 3; s++) {
      // Expected sales ≈ min(inv, Poisson/Binomial mean) — use soft min
      const demand = mu * buyProb;
      const sales = Math.min(inv[s], demand);
      weekSales += sales;
      weekRev += sales * p;

      const left = inv[s] - sales;
      // Rough continuation: remaining units × future average net price
      const futureCapAvg = remainingWeeks > 1
        ? weekCap(Math.min(12, week + Math.floor(remainingWeeks / 2)))
        : 0;
      const contPrice = futureCapAvg * 0.55;
      leftoverValue += left * contPrice * (remainingWeeks > 1 ? 0.85 : 0);
    }

    // Soft penalty for selling far above/below target (smooth inventory path)
    const targetTotal = targetPerSku.reduce((a, b) => a + b, 0);
    const miss = Math.abs(weekSales - targetTotal);
    const score = weekRev + leftoverValue - miss * p * 0.08;

    scores.push({ p, score });
    if (score > bestScore) {
      bestScore = score;
      bestP = p;
      bestSales = weekSales;
      bestRev = weekRev;
    }
  }

  // Safe band: prices within ~3% of best score
  const threshold = bestScore * 0.97;
  const good = scores.filter((s) => s.score >= threshold).map((s) => s.p);
  const bandLo = good.length ? Math.min(...good) : bestP;
  const bandHi = good.length ? Math.max(...good) : bestP;

  // Why text
  const scarce = inv.filter((q) => q <= 2).length;
  const heavy = inv.filter((q) => q >= 7).length;
  let why = `Cap this week is HK$${cap}. `;
  if (week >= 11 && totalInv >= 6) {
    why += "Late season with stock left — cut price to clear.";
  } else if (scarce >= 2) {
    why += "Stock is tight — hold a high price.";
  } else if (heavy >= 2 && week >= 8) {
    why += "Heavy inventory late — price lower to move units.";
  } else {
    why += `Aiming to sell ~${bestSales.toFixed(1)} units this week while protecting leftover value.`;
  }

  return {
    price: bestP,
    band: [bandLo, bandHi],
    cap,
    why,
    expectedSales: Math.round(bestSales * 10) / 10,
    expectedRevenue: Math.round(bestRev),
  };
}

/** Quick lookup table for balanced inventory (same count on A/B/C) */
export function cheatSheet(): { week: number; stock: number; price: number }[] {
  const rows: { week: number; stock: number; price: number }[] = [];
  for (const stock of [10, 6, 3, 1]) {
    for (let week = 1; week <= 12; week++) {
      const r = recommendPrice(week, [stock, stock, stock]);
      rows.push({ week, stock, price: r.price });
    }
  }
  return rows;
}
