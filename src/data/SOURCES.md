# VoiceMatch — Catalog Sources, Provenance, and Verification Log

**Workstream:** Person 3 (Catalog & Provenance Owner)  
**Catalog As-Of Date:** 2026-10-17  
**Status:** Seed Verified Catalog Active (`person3/catalog`)

---

## 1. Provenance and Verification Policy

VoiceMatch recommends phone and plan bundles for users with varied digital literacy and accessibility needs. To guarantee trustworthiness:
1. **Zero Hallucinated Pricing:** All phone retail prices, financing terms, and plan line prices are verified from official T-Mobile US listings and official manufacturer specifications.
2. **Explicit Line-Count Pricing:** Carrier advertised rates often emphasize multi-line pricing (e.g. "$25/line for 4 lines"). We explicitly store exact prices keyed by line count. Single-line shoppers are NEVER quoted multi-line division prices.
3. **Explicit Unknowns:** Unknown prices, specs, or compatibility statuses remain `null` or `'unknown'`. They are never defaulted to `0`, `false`, or assumed positive.
4. **Transparent Heuristics:** Internal 1–5 feature scores (camera, battery, displayReadability, simplicity, hotspotScore) are our own ranking heuristics, not external carrier or review ratings.

---

## 2. Verified Sources Directory

### Phone Models

#### 1. Samsung Galaxy A15 5G
- **Model ID:** `samsung-galaxy-a15-5g`
- **Brand:** Samsung
- **Official Source URL:** https://www.t-mobile.com/cell-phone/samsung-galaxy-a15-5g
- **Manufacturer Specs:** https://www.samsung.com/us/smartphones/galaxy-a15-5g/
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $228.00 USD
- **Financing Term:** 24 months @ $9.50/mo (0% APR for well-qualified buyers)
- **Key Hardware Specs:** 6.5" FHD+ Super AMOLED (90Hz, 800 nits Vision Booster), 5,000 mAh battery, 50 MP main + 5 MP ultra-wide + 2 MP macro, 13 MP front.
- **Accessibility Verification:**
  - `hearingCompatibility`: **yes** (HAC rating M3/T3, Android ASHA support)
  - `largeTextFeatures`: **yes** (Samsung One UI font size slider, high contrast fonts, bold text, display zoom)
  - `screenReaderSupported`: **yes** (Android TalkBack)

#### 2. Apple iPhone 16 (128GB)
- **Model ID:** `apple-iphone-16`
- **Brand:** Apple
- **Official Source URL:** https://www.t-mobile.com/cell-phone/apple-iphone-16
- **Manufacturer Specs:** https://www.apple.com/iphone-16/specs/
- **Verification Date:** 2026-10-17
- **Full Retail Price (FRP):** $829.99 USD
- **Financing Term:** 24 months @ $34.59/mo (0% APR for well-qualified buyers)
- **Key Hardware Specs:** 6.1" Super Retina XDR OLED (2,000 nits peak outdoor brightness), A18 Bionic chip, 48 MP Fusion camera + 12 MP ultra-wide with Macro, Camera Control button.
- **Accessibility Verification:**
  - `hearingCompatibility`: **yes** (FCC M3/T4 rated, Made for iPhone (MFi) hearing aids, Bluetooth LE Audio)
  - `largeTextFeatures`: **yes** (Dynamic Type, Accessibility Larger Text, Display Zoom, Bold Text)
  - `screenReaderSupported`: **yes** (Apple VoiceOver)

---

### Service Plans

#### 1. T-Mobile Essentials Saver
- **Plan ID:** `tmobile-essentials-saver`
- **Official Source URL:** https://www.t-mobile.com/cell-phone-plans
- **Verification Date:** 2026-10-17
- **Monthly Pricing by Line Count:**
  - **1 Line:** $50.00 / month (with AutoPay discount)
  - **2 Lines:** $80.00 / month ($40/line with AutoPay discount)
  - **3+ Lines:** Not offered / capped at 2 lines
- **AutoPay Assumptions:** Requires linked bank account or debit card for $5/line monthly discount. Without AutoPay, cost increases by $5/line.
- **Tax and Fee Assumptions:** Taxes and regulatory/telco recovery fees ($5–$10/line) are billed additionally.
- **Data & Hotspot Allowance:** 50 GB high-speed mobile data, unlimited 3G mobile hotspot, SD (480p) streaming video.
- **Eligibility:** Available to new and existing accounts; capped at maximum 2 voice lines per account.

#### 2. T-Mobile Essentials Choice 55+
- **Plan ID:** `tmobile-essentials-55`
- **Official Source URL:** https://www.t-mobile.com/cell-phone-plans/unlimited-55-senior-discount-plans
- **Verification Date:** 2026-10-17
- **Monthly Pricing by Line Count:**
  - **1 Line:** $45.00 / month (with AutoPay discount)
  - **2 Lines:** $60.00 / month ($30/line with AutoPay discount)
  - **3+ Lines:** Not offered / capped at 2 lines
- **AutoPay Assumptions:** Requires linked bank account or debit card for $5/line discount.
- **Tax and Fee Assumptions:** Taxes and government fees are extra.
- **Data & Hotspot Allowance:** 50 GB premium mobile data, unlimited 3G mobile hotspot, SD (480p) video streaming, Scam Shield protection.
- **Eligibility:** Primary account holder must be age 55 or older. Age verification required within 45 days. Account maximum is 2 voice lines.

---

## 3. Disclaimers & Known Limitations

1. **Device Connection Charge:** T-Mobile charges a one-time $35 Assisted/Device Connection Charge per line on new device activations. This is documented in assumptions and excluded from monthly recurring estimates.
2. **Upfront Taxes:** On Equipment Installment Plans (EIP), state and local sales taxes on the *full retail price* are typically due at purchase.
3. **Promotional Bill Credits:** Many carrier advertisements assume 24 or 36 months of bill credits with qualifying trade-in or new high-tier line activations. VoiceMatch baseline recommendations reflect non-promotional standard retail financing unless an explicit trade-in/promo is confirmed.
4. **AutoPay Requirement:** Quoted monthly rates assume enrollment in AutoPay with an eligible debit card or checking account ($5/line discount, up to 8 lines). Credit cards are no longer eligible for the T-Mobile AutoPay discount.
