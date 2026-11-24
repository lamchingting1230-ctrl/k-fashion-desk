# K-Fashion Desk (IIMT3636)

Interactive pricing desk for the **Dynamic Pricing at K-Fashion** group competition.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL (usually http://localhost:5173).

## Tabs

| Tab | Use |
|-----|-----|
| **Price** | Live calculator for class. Set week + inventory → get recommended common price → copy Mentimeter line (`Group X price`). Record sales after each reveal. |
| **Practice** | Full random season simulator. Compare your prices to a simple hindsight benchmark. |
| **Playbook** | Strategy notes + backup cheat-sheet when A=B=C. |

## Case rules (summary)

- 12 weeks, SKUs A/B/C start at 10 units each, no replenishment, zero salvage.
- One common non-negative integer price per week.
- Visits: Weeks 1–8 ~ N(800, 200); Weeks 9–12 ~ N(1600, 400).
- Interest 1/50, then equal SKU preference → 1/150 per SKU.
- WTP ~ Uniform[0, 1000 − 4(t−1)²].

## Mentimeter

Submit **once** per week as:

```text
Group 4 790
```

Late / blank / wrong format / duplicate → instructor sets price to **999**.

## Deploy (optional public URL)

Any static host works after `npm run build` (output in `dist/`).

Examples:

- [Vercel](https://vercel.com) — import this repo
- [Netlify](https://netlify.com) — drag `dist` or connect repo
- GitHub Pages — enable Pages on the `dist` branch or use an action

## Disclaimer

Heuristic inventory-aware pricing for teaching and in-class use. Not a guarantee of R*. Always double-check week and inventory before submitting.
