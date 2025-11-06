# ALONEA (ALO) Web3 Ecosystem - Design Guidelines

## Design Approach
**Reference-Based: Modern DeFi Aesthetic**
Drawing inspiration from leading DeFi platforms (Uniswap, PancakeSwap, Aave) combined with Web3 dashboard excellence (Zapper, DeBank). The design will establish trust through clarity while maintaining the innovative spirit of blockchain technology.

## Core Design Principles
1. **Data Transparency**: Financial information must be immediately scannable
2. **Progressive Disclosure**: Complex blockchain operations simplified through stepped UI
3. **Trust Through Clarity**: No hidden fees, clear transaction states, visible confirmations
4. **Glassmorphism Restraint**: Use sparingly for cards and modals, not as primary aesthetic

## Typography System

**Font Stack:**
- Primary: 'Inter' (via Google Fonts) - all UI elements, body text
- Accent: 'Space Grotesk' (via Google Fonts) - headings, token values, large numbers

**Hierarchy:**
- Hero Numbers (Token prices, APY): text-5xl to text-7xl, font-bold, Space Grotesk
- Page Headings: text-3xl to text-4xl, font-semibold, Space Grotesk
- Section Titles: text-xl to text-2xl, font-semibold, Inter
- Card Titles: text-lg, font-medium, Inter
- Body Text: text-base, font-normal, Inter
- Small Print (Gas fees, disclaimers): text-sm, font-normal, Inter
- Micro Text (Timestamps): text-xs, Inter

## Layout System

**Spacing Primitives:**
Core units: 2, 3, 4, 6, 8, 12, 16, 24
- Compact spacing (within cards): p-3, p-4, gap-2, gap-3
- Standard spacing (between elements): p-6, p-8, gap-4, gap-6
- Section spacing: py-12, py-16, py-24
- Component margins: mb-6, mb-8, mb-12

**Grid System:**
- Dashboard: 12-column grid with responsive breakpoints
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for feature cards
- Staking tiers: grid-cols-2 md:grid-cols-3 lg:grid-cols-5 (all 5 tiers visible on desktop)
- Governance proposals: Single column list with expanded detail view

**Container Strategy:**
- Max-width: max-w-7xl for main content areas
- Dashboard stats: max-w-screen-xl for full-width data displays
- Modals/Forms: max-w-md to max-w-lg centered

## Component Library

### Navigation
**Header:** Fixed position with backdrop blur, contains logo, network indicator (BSC badge), wallet connection button, theme toggle. Height: h-16 to h-20.

**Sidebar Navigation (Desktop):** Left-aligned, w-64, sticky position with Dashboard, Staking, Governance, Buyback sections. Each nav item includes icon (Heroicons) and label.

**Mobile Navigation:** Bottom sheet drawer that slides up, full-screen overlay with large touch targets (min-h-14).

### Dashboard Components

**Stats Cards:**
Glassmorphic cards with backdrop-blur-xl, rounded-2xl, p-6 spacing. Each card displays:
- Label (text-sm, uppercase, tracking-wide)
- Large value (text-4xl, font-bold, Space Grotesk)
- Change indicator with arrow icon and percentage
- Subtle divider line between sections

**Wallet Balance Display:**
Prominent card at top of dashboard, rounded-3xl, p-8:
- "Your ALO Balance" label
- Large token amount (text-6xl, Space Grotesk)
- USD equivalent below (text-xl, muted)
- Quick action buttons: Stake, Swap, Send (inline, gap-3)

**Staking Tier Cards:**
Five cards in responsive grid, each showing:
- Tier badge/icon at top
- Tier name (Bronze, Silver, etc.) as heading
- Required ALO amount (text-2xl)
- Multiplier badge (1.0x, 1.1x, etc.) prominently displayed
- Current stakers count (social proof)
- "Stake Now" button
- Active tier has distinct visual treatment (border glow effect)

**Rewards Display:**
Real-time counter with animated numbers:
- "Your Rewards" section within staking view
- Large number with decimal animation (text-5xl)
- "Claim Rewards" button (prominent, primary action)
- APY calculation shown below (text-lg)

### Governance Interface

**Proposal Cards:**
List view with each proposal in rounded-xl card, p-6:
- Proposal title (text-xl, font-semibold)
- Status badge (Active/Pending/Executed)
- Voting progress bar showing Yes/No percentages
- Quorum indicator
- Time remaining (countdown timer)
- Vote buttons (Yes/No/Abstain) inline at bottom
- Expand arrow for full details

**Voting Modal:**
Centered modal, max-w-lg:
- Proposal title and full description
- Current vote tally (visual bar chart)
- Your voting power display (based on staked ALO)
- Vote selection buttons (large, clear)
- Confirm transaction button
- Gas estimate display

### Transaction Components

**Transaction Status Toast:**
Slide in from top-right, rounded-xl, p-4:
- Icon: pending (spinning), success (checkmark), error (X)
- Transaction type label
- Transaction hash (truncated, click to copy)
- "View on BSCScan" link
- Auto-dismiss after 5s (success) or persistent (error)

**Connection Modal:**
Centered, max-w-md, rounded-2xl:
- "Connect Wallet" heading
- WalletConnect and MetaMask options as large buttons with logos
- Network selector (BSC Mainnet/Testnet) as tabs
- "New to crypto?" help link at bottom

### Forms

**Staking Form:**
Contained in card, p-6:
- Amount input with max button and balance display
- Token selector (if multi-token support later)
- Tier upgrade preview
- Estimated rewards calculation (live update)
- Approve + Stake buttons (two-step if needed)
- Fee breakdown expandable section

**Input Fields:**
- Rounded-lg borders
- Height: h-12 to h-14
- Font: text-lg for better mobile usability
- Placeholder text clearly distinct from input
- Label above input (text-sm, font-medium)
- Helper text below (text-xs)
- Error states with border highlight and error message

### Data Visualization

**APY Chart:**
Line chart showing historical APY, min-h-80:
- Gradient fill under line
- Hover tooltips with exact values
- Time range selector (7D, 30D, 90D, 1Y)
- Use Chart.js or Recharts library

**Transaction History Table:**
Responsive table with card fallback on mobile:
- Columns: Type, Amount, Status, Time, TxHash
- Sortable headers
- Pagination at bottom
- Mobile: Stacked cards with key info

## PWA-Specific Design Elements

**Install Prompt:**
Bottom sheet that slides up, p-6:
- App icon preview
- "Add to Home Screen" heading
- Benefits list (offline access, faster loading)
- Install button (primary action)
- Dismiss option

**Offline Indicator:**
Fixed bottom banner when offline, p-3:
- Offline icon + "You're offline" message
- Queued transactions counter
- Auto-hide when back online

**Loading States:**
- Skeleton screens matching exact component layouts
- Shimmer animation (subtle, professional)
- Progressive loading: critical data first, charts later

## Images Strategy

**Hero Section:**
Large hero image spanning full viewport width on landing page:
- Abstract blockchain/network visualization or geometric patterns representing connectivity
- Subtle gradient overlay for text readability
- Image should convey: technology, trust, growth, interconnection
- Placement: Homepage hero, behind heading and CTA buttons
- Blurred button backgrounds (backdrop-blur-lg) for CTAs on hero

**Icon Strategy:**
Use Heroicons throughout:
- Wallet icon for connection
- Chart icons for analytics
- Lock/unlock for staking
- Check/X for votes
- Arrow trends for price movements

No custom SVG generation - rely entirely on Heroicons library via CDN.

## Responsive Breakpoints

- Mobile: base (< 640px) - Single column, bottom navigation, stacked cards
- Tablet: md (768px+) - 2-column grids, visible sidebar option
- Desktop: lg (1024px+) - Full sidebar, 3-column grids, expanded charts
- Large: xl (1280px+) - Maximum data density, 5-column tier display

## Interaction Patterns

**Hover States:** Subtle scale transforms (scale-105), no color transitions
**Active States:** Slight scale down (scale-95), quick feedback
**Disabled States:** Reduced opacity (opacity-50), cursor-not-allowed
**Focus States:** Visible outline for keyboard navigation (ring-2)

## Animations: Minimal Usage

Use only for:
- Number counting animations (rewards, balances)
- Transaction status transitions
- Modal entrance/exit
- Loading shimmer

Avoid: Excessive scroll animations, decorative particles, distracting movements

---

This design creates a professional, trustworthy DeFi platform that balances visual appeal with functional clarity, ensuring users can confidently manage their crypto assets while maintaining modern Web3 aesthetics.