# 21st.dev component review for RiskWatch

Reviewed 28 October 2026. RiskWatch is a Next.js 15 / React 19 / TypeScript app with
hand-authored CSS, no Tailwind or shadcn configuration, a public synthetic-data demo,
custom dashboard navigation and search, and existing transaction and alert tables.

## Recommendation

Use 21st.dev to study interaction patterns, not as a drop-in component library for this
project. The catalog describes React/TypeScript components styled with Tailwind and
intended to compose with shadcn/ui. Installing the UI system just to add one component
would introduce a second styling system and disturb the established RiskWatch look.
The catalog's component install flow also requires a 21st API key.

The sign-in layout was the best immediate fit because the project had a non-functional
Sign in modal. Its composition has been adapted into a custom RiskWatch sign-in page,
with a real app preview, a clearly scoped email magic-link form, and an honest disabled
state until Supabase environment configuration exists. The 21st.dev source was not
copied: its listing reports an unknown license, and its social provider buttons would
not have been connected to configured providers.

## Component shortlist

| Priority | 21st.dev idea | RiskWatch fit | Decision |
|---|---|---|---|
| Immediate | [Sign In](https://21st.dev/@jahed/components/sign-in.md) | Replaces the old placeholder sign-in dialog with a dedicated, brand-matched route. Listing shows Tailwind-oriented install and unknown license. | Adapt the layout only; use invite-only email magic links through Supabase. |
| Next | [Leads Data Table](https://21st.dev/@isaiahbjork/components/leads-data-table.md) | Its catalog description includes row selection, bulk operations, hover actions, and a sliding action bar. Alert and case triage could benefit from deliberate batch workflows. | Best future feature: add safe multi-select and confirmed bulk assignment/disposition to the alert queue, preserving an audit trail. Do not copy its CRM UI or source. |
| Keep current | [Dashboard Sidebar](https://21st.dev/@arunjdass/components/dashboard-sidebar.md) | Similar navigation framing, but RiskWatch already has grouped active-route navigation and responsive behavior. | Do not replace. Borrow a specific interaction only if a concrete navigation issue appears. |
| Keep current | [Donut Chart](https://21st.dev/@ravikatiyar162/components/donut-chart.md) | Could inspire a compact severity or disposition view, but the app already renders SVG charts. | Do not add a chart for decoration; only revisit for a clearly stated analyst question. |
| Reject | [Cases with Infinite Scroll](https://21st.dev/@tommyjepsen/components/cases-with-infinite-scroll.md) | Despite its name, its catalog description is a client/partner/integration image carousel, not an analyst case workflow. | Not a product fit. |

The selected entries above report unknown licenses. Do not copy their source unless
usage rights are clarified. The sign-in page implemented for RiskWatch is a new,
project-specific adaptation rather than a code import.

## Product and auth decisions

- Keep the dashboard public for the synthetic-data interview/demo path.
- Use invite-only email magic links for account sign-in; do not expose social sign-in
  buttons until the Supabase project has those providers configured and approved.
- A sign-in session does not protect the dashboard routes. Do not treat this UI as
  authorization for real financial or customer data.
- The supplied database connection string is not a Supabase Auth URL or publishable
  key; use the dedicated environment variables documented in `AUTH_SETUP.md`.

## Sources

- [21st.dev catalog overview](https://21st.dev/) — catalog format, supported stacks,
  React/TypeScript and Tailwind/shadcn positioning.
- [21st.dev MCP documentation](https://21st.dev/mcp.md) — MCP search and component
  retrieval workflow; API-key requirement.
- [21st.dev Sign In metadata](https://21st.dev/@jahed/components/sign-in.md)
- [21st.dev Leads Data Table metadata](https://21st.dev/@isaiahbjork/components/leads-data-table.md)
- [21st.dev Dashboard Sidebar metadata](https://21st.dev/@arunjdass/components/dashboard-sidebar.md)
- [21st.dev Donut Chart metadata](https://21st.dev/@ravikatiyar162/components/donut-chart.md)
- [21st.dev Cases with Infinite Scroll metadata](https://21st.dev/@tommyjepsen/components/cases-with-infinite-scroll.md)
- Repository context: `components/ui/DataTable.tsx`, `components/layout/AppSidebar.tsx`,
  `components/layout/AppTopBar.tsx`, and `components/layout/AppLayout.tsx`.
