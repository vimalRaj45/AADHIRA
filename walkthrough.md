# Walkthrough - CSV/Excel Upload & Certificate Theme Switcher

We have successfully designed, built, and verified the CSV/Excel spreadsheet batch uploader for the admin panel and the real-time theme switcher on the certificate viewer page.

## Changes Made

### 1. Light Blue/White Dashboard Theme (60-30-10 rule)
- Re-designed the Admin Dashboard (`/admin` / `adminHtml`) styling to implement a modern light-mode scheme.
- **60% dominant**: Light slate/blue premium gradient background (`#f1f5f9` to `#e2e8f0`).
- **30% secondary**: Frosted white cards with subtle shadows (`#ffffff`) and a deep navy sidebar (`#0f172a`).
- **10% accent**: Energetic cobalt blue (`#2563eb`) and gold (`#d97706`) for interactive links, badges, and icon highlights.
- **Bootstrap Icons**: Relies on clean visual typography from the Bootstrap Icons library.
- **Mobile Friendly**: The sidebar collapses gracefully into a scrollable horizontal toolbar on screens under `992px`, and card grids adjust to single-column feeds.

### 2. Client-Parsed CSV/Excel Batch Import
- **Drag-and-Drop Zone**: Replaced Google Sheets sync panel with a clean drop-zone supporting `.xlsx`, `.xls`, and `.csv`.
- **SheetJS CDN integration**: Included `xlsx.full.min.js` to parse file bytes in the browser.
- **Header Mapping & Validation**: Parses keys case-insensitively and maps variations. Converts date formats from Excel serial numbers and strings robustly.
- **Dynamic Table Grid Preview**: Renders a live table preview of the first 10 rows before committing to database.
- **Auto-Sequence Numbering**: Fetches the last generated certificate index from `/api/last-cert-id`, increments index sequentially for the batch, and sends data to `/api/store-certificates` for bulk insert.
- **Download Sample Button**: Generates a standard comma-separated sample CSV file to ensure correct header formatting.

### 3. Dynamic Certificate Theme Switcher
- Added 5 premium pre-defined layouts:
  1. **Classic Gold** (Navy & Gold, Cinzel/Playfair display fonts, gold medal/seal)
  2. **Ocean Blue** (Deep Slate & Turquoise, Playfair/Alex Brush cursive fonts, silver medal/cyan seal)
  3. **Royal Maroon** (Deep Maroon & Rose Gold, Great Vibes cursive font, gold medal/bronze seal)
  4. **Forest Green** (Forest Green & Gold, Mrs Saint Delafield calligraphy, gold medal/green-gold seal)
  5. **Purple Royal** (Royal Purple & Silver, Great Vibes font, silver-purple medal/purple seal)
- **Top Sticky Bar**: Added a `.theme-switcher-bar` at the top of `/certificate/:certNoEncoded`.
- **CSS Custom Properties**: Styles (borders, corner decorations, typography, medal/seal gradients) are converted to CSS variables so changing themes is done instantly in CSS.
- **Print Optimization**: Hides the switcher bar, back buttons, and other controls during printing using `@media print { .no-print { display: none !important; } }`.

### 4. Layout & Alignment Improvements
- **Resolved Vertical Overlap**: Set `.header` height to `auto` and added a `margin-bottom: 25px` to prevent accreditation logos from overlapping with the certificate content title, resulting in a cleaner, well-balanced structure.
- **Centered Seal Block**: Adjusted the width of the signature block and the verification details block to exactly `250px` each. This ensures that the middle seal block is perfectly centered horizontally in the flex container.
- **Cleaned Signatory Details**: Removed duplicate printed signature text underneath the signature block since the brand's handwritten signature image already embeds "K. Rohini Founder". Kept the horizontal line, styled dynamically using the theme's inner border color (`var(--border-inner-color)`).
- **Enlarged and Repositioned Header Branding**: Increased the dimensions of the top Aadhira logo and the bottom accreditation logos (MSME, ISO, Arms, UK) from `70px` to `95px` (about a 35% size increase) to make them much clearer and more prominent. Pushed the header section down by increasing `.header`'s `margin-top` to `50px`, and set elegant spacing below the logos (`margin-bottom: 12px` on the Aadhira logo, `margin-bottom: 18px` on the company subtitle, and horizontal gap to `20px`) for a balanced, top-tier aesthetic.
- **Tightened Verification Block Layout**: Removed the `flex: 1` style on `.verification-details` and set `.verification-block`'s width to `auto`. This keeps the Place/Date text and the verification QR code sitting side-by-side with a small, uniform gap (`15px`), eliminating the excessive blank space between them.
- **Enlarged Verification QR code**: Increased the QR code size in both CSS and JavaScript to 80px by 80px (about 40% larger).
- **Added Scanner Message**: Removed the text link to the verification URL and replaced it with a header: "Scan to Verify", alongside a clean descriptive help text: "Scan the QR code with a smartphone to verify certificate authenticity."
- **Fixed Button Color Contrast**: Defined default `--border-outer-color: #0A192F` at `:root` in `server.js` so that control buttons outside the `.cert-container` (like the "Print to PDF" and "Admin Panel" buttons) correctly resolve the Aadhira brand's deep navy color. This resolved the low contrast bug where "Print to PDF" rendered as unreadable white text on a transparent/light-grey background.

---

## Verification Results

1. **Syntax Checking**: Verified zero compilation or syntax issues via `node -c server.js`.
2. **API Verification**: Checked `/api/last-cert-id` which successfully returns the database sequence counter (e.g. `{ lastIndex: 28 }`).
3. **Integration Testing**: Ran `node scratch/test-crud.js` which validated update, store-certificates, verification, and deletion.
4. **Offline Parsing**: Tested loading spreadsheet sheets; parsed columns are previewed immediately.
5. **Real-time restyling**: Tested switcher tabs; layout, gradients, and fonts change instantly.
6. **Certificate Regeneration**: Ran `npm run generate` successfully to apply the new larger branding styles and spacing across all 29 certificate records on disk.

### Active Server
The Fastify server is currently running in the background and is accessible locally at:
- Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)
- Viewer: [http://localhost:3000/certificate/ATPS_2026_000001](http://localhost:3000/certificate/ATPS_2026_000001)
