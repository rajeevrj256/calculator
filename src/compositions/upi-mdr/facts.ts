/**
 * Every number and date used in the UPI MDR video lives here, and nowhere else.
 * If a figure changes (e.g. the government amends the framework before Oct 15,
 * 2026), update it once here — every scene reads from this object.
 *
 * Verification status as of the fact-check pass: all figures below are
 * corroborated by multiple independent outlets (Business Standard, BusinessToday,
 * SCC Online) that attribute them to the NPCI FAQ sheet (15 Sept 2026) and
 * Finance Ministry statements. Direct fetch of npci.org.in and pib.gov.in was
 * blocked (403/redirect) during research — see SOURCES below for what was
 * actually used. The one soft spot: the "~96% of P2M unaffected" figure has
 * mixed attribution (one outlet ties it to official government info, another to
 * a private commentator) — it is deliberately NOT used anywhere in this video.
 */

export const VERIFIED_FACTS = {
  effectiveDate: 'October 15, 2026',
  standardRateLabel: '0.4%',
  standardRateDecimal: 0.004,
  merchantFreeThreshold: 2000, // P2M transactions at/below this stay zero-MDR
  exampleAmount: 5000,
  exampleMdr: 20, // 5000 * 0.004
  capAmount: 300,
  capThreshold: 75000,
  smallMerchantMonthlyLimit: 100000, // ₹1 lakh, P2PM category
  specialCategories: ['Railways', 'Telecom', 'Insurance', 'Fuel'] as const,
  specialCategoryFlatFee: 5,
  isTax: false,
  customerPaysDirectly: false,
  augustVolumeBillion: 24.51,
  augustValueLakhCrore: 29.82,
} as const;

export const SOURCES = [
  {
    label: 'BusinessToday — UPI MDR rules & FAQs (15 Sep 2026)',
    url: 'https://www.businesstoday.in/personal-finance/story/upi-mdr-rules-rs12-on-rs3000-rs200-on-rs50000-and-rs300-cap-on-rs75000-payments-check-faqs-555724-2026-09-15',
  },
  {
    label: 'SCC Online — NPCI MDR FAQs explained',
    url: 'https://www.scconline.com/blog/post/2026/09/16/npci-released-upi-mdr-faqs-explained/',
  },
  {
    label: 'Business Standard — MDR, no foreign influence, Finance Ministry',
    url: 'https://www.business-standard.com/finance/news/no-foreign-influence-behind-mdr-on-upi-payments-above-2-000-finmin-126091600993_1.html',
  },
  {
    label: 'BusinessToday — small merchants exemption (P2PM, ₹1 lakh/month)',
    url: 'https://www.businesstoday.in/personal-finance/news/story/small-merchants-will-not-come-under-upi-mdr-even-above-rs2000-if-they-meet-this-condition-check-details-555727-2026-09-15',
  },
  {
    label: 'Business Standard — August 2026 UPI record volume (NPCI data)',
    url: 'https://www.business-standard.com/finance/news/upi-transactions-august-2026-record-volume-npci-126090100506_1.html',
  },
] as const;

/** NOT used in the video — attribution to government vs. a private commentator
 *  is mixed across sources. Keeping the note here so nobody re-adds it blind. */
export const UNVERIFIED_CLAIMS = [
  '~96% of P2M transactions unaffected — attribution inconsistent, excluded',
] as const;
