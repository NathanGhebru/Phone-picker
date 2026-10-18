# VoiceMatch — Catalog Sources, Provenance, and Verification Log

**Workstream:** Person 3 (Catalog & Provenance Owner)  
**Catalog As-Of Date:** 2026-10-17  
**Catalog Version:** 1.1.0  
**Current Milestone:** 6 Verified Phones & 3 Verified Plans (`person3/catalog`)

---

## 1. Provenance Policy & Pricing Conventions

To ensure absolute price honesty and prevent algorithmic bias, VoiceMatch enforces strict data provenance standards:

### Decision 1: Monthly Plan Price Format (`monthlyPriceByLines`)
- `monthlyPriceByLines` contains the **standard advertised monthly rate reflecting enrollment in AutoPay** (e.g., $50 for 1 line on Essentials Saver 2.0; $45 for 1 line on Essentials Choice 55 2.0; $75 for 1 line on Go5G).
- This matches standard customer-facing quotes and consumer expectation while shopping.
- For complete transparency, each plan also contains `undiscountedMonthlyPriceByLines` (recording Broadband Facts prices without AutoPay: $55/1 line on Essentials Saver 2.0; $50/1 line on Essentials Choice 55 2.0; $80/1 line on Go5G) and `autoPayDiscountPerLine` ($5.00/line).

### Decision 2: Customer Eligibility (New vs. Existing)
- All plans currently cataloged are available to **both new and existing customers**, subject to specific line count and eligibility limits:
  - `tmobile-essentials-saver-2`: New and existing customers; capped at maximum 2 voice lines per account.
  - `tmobile-essentials-choice-55-2`: New and existing customers; requires primary account holder age 55+ with government ID verification within 45 days; capped at maximum 2 voice lines.
  - `tmobile-go5g`: New and existing customers; supports 1 to 5+ voice lines.

### Decision 3: Payment Method Conditions for AutoPay Discount
- The $5/line monthly AutoPay discount is **strictly conditional** on enrolling in automatic payments using an **eligible bank account (ACH/checking) or debit card**.
- Under T-Mobile's updated policy, standard credit cards and credit-card backed mobile wallets (Apple Pay or Google Pay linked to credit cards) **do not qualify** for the AutoPay discount.

### Decision 4: Taxes, Regulatory Fees, and Upfront Charges
- **Essentials Tiers (`tmobile-essentials-saver-2`, `tmobile-essentials-choice-55-2`):** Base monthly prices **exclude** state and local sales taxes, government surcharges, and carrier regulatory fees (such as the Telco Recovery Fee). These fees vary widely by state and municipality and are billed additionally.
- **Go5G Tier (`tmobile-go5g`):** Monthly recurring service pricing **includes** standard sales taxes and monthly regulatory fees for qualifying consumer accounts.
- **Device Purchases (EIP Financing):** Monthly device installments are based on 0% APR full retail price divided by 24 months for well-qualified buyers. Device financing **excludes** local sales taxes (which must be paid upfront at purchase/checkout) and the one-time **$35 Assisted/Device Connection Charge** per activated line.

### Decision 5: Internal Heuristics vs. Official Ratings
- All 1–5 feature scores (`camera`, `battery`, `displayReadability`, `simplicity`, `hotspotScore`) are **internal team ranking heuristics** defined by VoiceMatch to support deterministic recommendation sorting.
- They are **NOT** official manufacturer ratings, independent lab scores, or carrier evaluations.

---

## 2. Verified Service Plans Directory

### 1. T-Mobile Essentials Saver 2.0
- **Plan ID:** `tmobile-essentials-saver-2`
- **Official Source URL:** https://www.t-mobile.com/cell-phone-plans
- **Broadband Facts Source:** FCC Broadband Disclosures & Cart Summary
- **Verification Date:** 2026-10-17
- **Monthly Base Pricing (with AutoPay):**
  - **1 Line:** $50.00 / month
  - **2 Lines:** $80.00 / month ($40.00 per line)
  - **3+ Lines:** Unavailable (strictly capped at 2 lines)
- **Undiscounted Base Pricing (without AutoPay):**
  - **1 Line:** $55.00 / month
  - **2 Lines:** $90.00 / month
- **AutoPay Terms:** $5/line discount included when enrolled with debit card or checking account.
- **Taxes & Fees:** Excluded; billed additionally based on local jurisdiction (variable; not a fixed universal amount).
- **Data & Hotspot:** 50 GB high-speed mobile data (may be deprioritized during congestion), unlimited 3G mobile hotspot, SD (480p) video streaming.
- **Restrictions:** Max 2 lines.

### 2. T-Mobile Essentials Choice 55 2.0
- **Plan ID:** `tmobile-essentials-choice-55-2`
- **Official Source URL:** https://www.t-mobile.com/cell-phone-plans/unlimited-55-senior-discount-plans
- **Broadband Facts Source:** FCC Broadband Disclosures (Senior 55+ Portal)
- **Verification Date:** 2026-10-17
- **Monthly Base Pricing (with AutoPay):**
  - **1 Line:** $45.00 / month
  - **2 Lines:** $60.00 / month ($30.00 per line)
  - **3+ Lines:** Unavailable (strictly capped at 2 lines)
- **Undiscounted Base Pricing (without AutoPay):**
  - **1 Line:** $50.00 / month
  - **2 Lines:** $70.00 / month
- **AutoPay Terms:** $5/line discount included when enrolled with debit card or checking account.
- **Taxes & Fees:** Excluded; billed additionally based on local jurisdiction.
- **Data & Hotspot:** 50 GB premium data, unlimited 3G mobile hotspot, SD (480p) video streaming, Scam Shield protection included.
- **Restrictions:** Primary account holder must be 55+ with ID verification within 45 days. Max 2 lines.

### 3. T-Mobile Go5G
- **Plan ID:** `tmobile-go5g`
- **Official Source URL:** https://www.t-mobile.com/cell-phone-plans
- **Verification Date:** 2026-10-17
- **Monthly Base Pricing (with AutoPay):**
  - **1 Line:** $75.00 / month
  - **2 Lines:** $130.00 / month ($65.00 per line)
  - **3 Lines:** $130.00 / month (reflecting standard promotional 3rd line on us) / $155 standard without promo
  - **4+ Lines:** Supported
- **Undiscounted Base Pricing (without AutoPay):**
  - **1 Line:** $80.00 / month
  - **2 Lines:** $140.00 / month
  - **3 Lines:** $145.00 / month
- **AutoPay Terms:** $5/line discount included when enrolled with debit card or checking account.
- **Taxes & Fees:** Included in base monthly service price.
- **Data & Hotspot:** 100 GB premium high-speed mobile data, 15 GB high-speed mobile hotspot data (then unlimited 3G speeds), SD (480p) streaming video.
- **Restrictions:** None (open to all customers; 1-5+ lines).

---

## 3. Verified Phone Directory

*Note: Samsung Galaxy A15 5G was removed from the active catalog because T-Mobile currently labels it as no longer available. It was replaced with the currently offered Motorola moto g 5G - 2024 and T-Mobile REVVL 7 5G.*

### 1. Motorola moto g 5G - 2024
- **Model ID:** `motorola-moto-g-5g-2024`
- **Brand:** Motorola
- **Official Source URL:** https://www.t-mobile.com/cell-phone/motorola-moto-g-5g-2024
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $199.99 USD
- **Financing Term:** 24 months @ $8.34/mo (0% APR, $0 down for well-qualified buyers)
- **Display:** 6.6" HD+ (1612 x 720) IPS LCD, 120Hz refresh rate
- **Battery:** 5,000 mAh (up to 2 days basic use, 18W fast charging)
- **Camera:** 50 MP main (f/1.8) Quad Pixel + 2 MP macro, 8 MP front
- **Accessibility:**
  - `hearingCompatibility`: **yes** (FCC M3/T3 rated)
  - `largeTextFeatures`: **yes** (Android 14 font size slider, high contrast fonts, display size zoom)
  - `screenReaderSupported`: **yes** (Android TalkBack)

### 2. T-Mobile REVVL 7 5G
- **Model ID:** `t-mobile-revvl-7-5g`
- **Brand:** T-Mobile
- **Official Source URL:** https://www.t-mobile.com/cell-phone/t-mobile-revvl-7-5g
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $199.99 USD
- **Financing Term:** 24 months @ $8.34/mo (0% APR, $0 down)
- **Display:** 6.58" FHD+ (2408 x 1080), 120Hz refresh rate
- **Battery:** 5,000 mAh, 15W fast charging
- **Camera:** 50 MP main + 2 MP depth, 8 MP front
- **Accessibility:**
  - `hearingCompatibility`: **yes** (FCC M3/T3 rated)
  - `largeTextFeatures`: **yes** (Android display and font scaling)
  - `screenReaderSupported`: **yes** (Android TalkBack)

### 3. Samsung Galaxy S24 FE
- **Model ID:** `samsung-galaxy-s24-fe`
- **Brand:** Samsung
- **Official Source URL:** https://www.t-mobile.com/cell-phone/samsung-galaxy-s24-fe
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $649.99 USD (128GB)
- **Financing Term:** 24 months @ $27.09/mo (0% APR, $0 down)
- **Display:** 6.7" Dynamic AMOLED 2X, 120Hz, up to 1,900 nits peak brightness
- **Battery:** 4,700 mAh, 25W fast charging
- **Camera:** Triple pro-grade camera: 50 MP wide (OIS) + 8 MP telephoto (3x optical zoom) + 12 MP ultra-wide, 10 MP front
- **Accessibility:**
  - `hearingCompatibility`: **yes** (FCC M3/T3 rated, ASHA hearing aid support)
  - `largeTextFeatures`: **yes** (Samsung One UI font size, high-contrast themes, bold fonts, display zoom)
  - `screenReaderSupported`: **yes** (TalkBack)

### 4. Samsung Galaxy S24
- **Model ID:** `samsung-galaxy-s24`
- **Brand:** Samsung
- **Official Source URL:** https://www.t-mobile.com/cell-phone/samsung-galaxy-s24
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $799.99 USD (128GB)
- **Financing Term:** 24 months @ $33.34/mo (0% APR, $0 down)
- **Display:** 6.2" Dynamic AMOLED 2X, 1-120Hz adaptive, 2,600 nits peak outdoor brightness
- **Battery:** 4,000 mAh, fast charging, wireless charging
- **Camera:** 50 MP wide (OIS) + 10 MP telephoto (3x optical zoom) + 12 MP ultra-wide, 12 MP front
- **Accessibility:**
  - `hearingCompatibility`: **yes** (FCC M3/T3 rated, ASHA streaming)
  - `largeTextFeatures`: **yes** (One UI Vision enhancements, font scaling, high contrast)
  - `screenReaderSupported`: **yes** (TalkBack)

### 5. Apple iPhone 15 (128GB)
- **Model ID:** `apple-iphone-15`
- **Brand:** Apple
- **Official Source URL:** https://www.t-mobile.com/cell-phone/apple-iphone-15
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $629.99 USD (128GB)
- **Financing Term:** 24 months @ $26.25/mo (0% APR, $0 down)
- **Display:** 6.1" Super Retina XDR OLED, Dynamic Island, 2,000 nits peak outdoor brightness
- **Battery:** 3,349 mAh (up to 20 hours video playback), MagSafe wireless charging
- **Camera:** 48 MP Main with 2x optical-quality telephoto + 12 MP Ultra Wide, 12 MP TrueDepth front
- **Accessibility:**
  - `hearingCompatibility`: **yes** (FCC M3/T4 rated, Made for iPhone (MFi) hearing aids, Bluetooth LE Audio)
  - `largeTextFeatures`: **yes** (Dynamic Type, Accessibility Larger Text, Display Zoom, Bold Text)
  - `screenReaderSupported`: **yes** (VoiceOver)

### 6. Apple iPhone 16 (128GB)
- **Model ID:** `apple-iphone-16`
- **Brand:** Apple
- **Official Source URL:** https://www.t-mobile.com/cell-phone/apple-iphone-16
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $829.99 USD (128GB)
- **Financing Term:** 24 months @ $34.59/mo (0% APR, $0 down)
- **Display:** 6.1" Super Retina XDR OLED, up to 2,000 nits peak outdoor brightness, 1 nit minimum brightness
- **Battery:** 3,561 mAh (up to 22 hours video playback), 25W MagSafe wireless charging
- **Camera:** 48 MP Fusion camera with 2x optical telephoto + 12 MP Ultra Wide with macro, physical Camera Control tactile button
- **Accessibility:**
  - `hearingCompatibility`: **yes** (FCC M3/T4 rated, MFi hearing devices, Bluetooth LE Audio)
  - `largeTextFeatures`: **yes** (Dynamic Type, Display Zoom, Bold Text, VoiceOver)
  - `screenReaderSupported`: **yes** (VoiceOver)
