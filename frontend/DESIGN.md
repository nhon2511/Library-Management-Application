# Quiet academic library — design contract

- **Direction:** quiet academic library; calm, trustworthy, editorial and operationally scannable.
- **Palette:** warm paper `#F5F2EA`, ink `#202825`, forest `#28584D`, terracotta accent `#B96F52`, neutral line `#D8D2C7`. Accent is reserved for attention and status.
- **Typography:** DM Sans for controls and data; Source Serif 4 for page titles and book metadata. No monospace except raw audit details.
- **Spacing:** 4px base rhythm, 16px control gaps, 30–56px page section spacing. Responsive breakpoints at 1050px and 760px.
- **Radius:** 6–9px for controls and surfaces. No decorative pills; status labels use a compact 5px radius.
- **Elevation:** borders first; shadow only for modal surfaces. No gradients, glow, blur, neon or decorative background effects.
- **Icon usage:** text labels carry meaning; only compact close/remove actions use a symbol. No emoji or decorative icons.
- **Motion:** short hover/focus transitions and loading shimmer only; `prefers-reduced-motion` disables motion.
- **Content states:** API-backed loading, empty, filtered-empty, error/retry and permission states are explicit. Numbers are never fabricated; overview charts render only from `/reports/overview` values.
