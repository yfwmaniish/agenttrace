# Swiss International Redesign Plan

This plan details the complete UI overhaul of the AgentTrace dashboard to adopt the Swiss International (International Typographic Style) design system.

## User Review Required
> [!IMPORTANT]
> This is a massive redesign. We are completely dropping the current dark theme, glassmorphism, and glow effects. The new UI will be light-themed (White/Black/#F2F2F2) with strict geometric layouts, zero border-radius, visible grid borders, and the "Swiss Red" (#FF3000) accent color. Please review the proposed changes below.

## Proposed Changes

---

### Global Design Tokens & Infrastructure
#### [MODIFY] globals.css
- **Colors:** Replace deep space palette with pure white, pure black, light gray (`#F2F2F2`), and Swiss Red (`#FF3000`).
- **Typography:** Enforce `Inter`. Setup massive scaling variables for typography.
- **Effects & Borders:** Remove all `border-radius`, glows, and glassmorphism. Add 2px and 4px thick borders.
- **Textures:** Add CSS classes for `.swiss-grid-pattern`, `.swiss-dots`, `.swiss-diagonal`, and `.swiss-noise`.
- **Animations:** Replace smooth ease animations with rapid, linear, snappy transitions.

#### [MODIFY] layout.tsx
- Switch html/body from `dark` to light. Apply noise texture globally.
- Redesign the `Sidebar` component: 
  - Remove rounded corners and glows.
  - Implement solid black borders, white background.
  - Update navigation hover states to brutalist color inversion (Black -> White, Red accents).
  - Update logo treatment to stark typography or geometric shapes.

---

### Dashboard Pages

#### [MODIFY] page.tsx
- Redesign the main Overview layout to use visible asymmetrical grid divisions.
- Prefix sections with numbered labels (e.g., `01. OVERVIEW`).
- **StatCards:** Use thick borders, massive numbers (`text-7xl` or larger), no rounded corners, inverted hover states.
- **ChainVisualization:** Redesign to look like a strict technical diagram. Use stark horizontal/vertical lines and stark node blocks.
- **ComplianceWidget & ActivityFeed:** Adopt harsh table-like structures, dot-matrix backgrounds on headers, and Swiss Red for alerts.

#### [MODIFY] sessions/page.tsx
- Convert the sessions list into a rigid, highly structured brutalist data table.
- Row hovers will trigger sharp color inversions or solid gray/red backgrounds.
- Remove all soft badges and replace them with sharp, uppercase, bordered labels.

#### [MODIFY] verify/page.tsx
- The tamper detection diffing UI will become highly clinical.
- Tampered fields will be highlighted in pure Swiss Red with stark borders.
- Valid chains will use pure black-on-white high contrast boxes.

#### [MODIFY] export/page.tsx
- Forms will use brutalist inputs (thick bottom borders, sharp red focus outlines).
- The export confirmation will use strong typography and stark visual feedback.

---

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run build` to ensure no regressions in TypeScript or Next.js build steps.
- Execute `.agent/skills/lint-and-validate/scripts/lint_runner.py .`

### Manual Verification
- Manually click through all pages: Overview, Sessions, Verify, Export.
- Ensure the layout holds together across screen sizes (responsive typography and grid scaling).
- Confirm that the "tampered" states in Verify stand out sharply with Swiss Red.

## Orchestration Phase
Currently in **Phase 1: Planning**. Awaiting user approval.
Once approved, we will transition to **Phase 2: Implementation**, where we will systematically modify the aforementioned files.
