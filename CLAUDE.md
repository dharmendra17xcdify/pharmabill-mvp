# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo dev server
npm start

# Run on Android (requires connected device or emulator)
npm run android

# Run on iOS (macOS only)
npm run ios

# Run web version
npm run web
```

There are no lint or test scripts configured. TypeScript type-checking can be done via the build process.

## Architecture Overview

**PharmaBill MVP** is an offline-first React Native/Expo pharmacy billing app. All data is stored locally in SQLite on the device.

### Routing

Uses **Expo Router** (file-based routing). The root layout ([app/_layout.tsx](app/_layout.tsx)) initializes the SQLite database and redirects to `setup.tsx` on first launch (no settings) or to the main `(tabs)` navigator otherwise.

### State Management

Three **Zustand** stores in [src/store/](src/store/):
- `useBillingStore` — shopping cart and invoice totals (GST-inclusive calculation)
- `useMedicineStore` — medicine inventory, synced with SQLite
- `useSettingsStore` — pharmacy configuration (store name, GSTIN, invoice prefix, etc.)

### Data Layer

**Repository pattern** in [src/db/](src/db/). Each repo wraps `expo-sqlite` calls:
- `billRepo.ts` — saves bills + items atomically, auto-deducts stock, provides analytics queries
- `medicineRepo.ts` — inventory CRUD + stock deduction
- `settingsRepo.ts` — single-row settings read/write

The DB schema is initialized in [src/db/](src/db/) (look for the `initDatabase` function called from the root layout).

### Services Layer

[src/services/](src/services/) contains business logic that doesn't belong in stores or repos:
- `invoiceService.ts` — renders an HTML template to PDF via `expo-print`
- `reportService.ts` — dashboard stats (today/month revenue, low-stock count)
- `shareService.ts` — native share sheet for PDF files

### Forms

All forms use **react-hook-form** + **Zod** schemas. Validators live in [src/utils/validators.ts](src/utils/validators.ts).

### GST Calculation

Selling prices are **GST-inclusive**. To extract tax:
```
taxable = lineTotal / (1 + gstPercent / 100)
gstAmount = lineTotal - taxable
```
Supported rates: 0%, 5%, 12%, 18%, 28%. Logic is in [src/utils/gst.ts](src/utils/gst.ts).

### PDF Invoices

Invoice HTML template is in [src/utils/invoice.ts](src/utils/invoice.ts). `invoiceService` passes bill data + store settings into the template, then calls `expo-print` to generate a PDF, which can be shared via `expo-sharing`.

### Key Constants

- Color palette: [src/constants/](src/constants/) — primary `#1565C0`, warning `#F57C00`, danger `#D32F2F`, success `#388E3C`
- Payment modes: Cash, UPI, Card

### Auto Invoice Numbering

Sequential bill numbers are stored in the `app_meta` SQLite table under the key `last_invoice_number`. The prefix comes from store settings (`invoice_prefix`, default `MED`).
