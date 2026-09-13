/**
 * Site-wide constants that templates and build scripts both need.
 *
 * GA_MEASUREMENT_ID is deliberately committed rather than injected from CI. It is public in
 * the page source of every page, so it is not a credential; and this repo has two
 * publishers, so anything configured per-publisher can silently differ between them. Set it
 * to '' to disable analytics everywhere, including production.
 */
export const GA_MEASUREMENT_ID = 'G-HHGYPST0ZT' // GA4 property 357921948

/** The only hostname that reports analytics. Preview deploys and file:// stay silent. */
export const ANALYTICS_HOST = 'bitsbytesgates.com'
