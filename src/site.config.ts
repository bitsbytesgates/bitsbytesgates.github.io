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

/**
 * Listmonk, self-hosted; see docs/email-subscription.md. Both values are public by
 * construction: the form posts to the URL and carries the UUID in every page's source.
 *
 * Leave LISTMONK_LIST_UUID as '' until the list exists. While it is empty, <Subscribe>
 * renders only the RSS link, so the site builds and deploys before Listmonk is up.
 */
/**
 * Master switch for email signup. While false, <Subscribe> renders nothing and the
 * /subscribe pages are parked under src/pages/_subscribe/ (Astro skips `_` dirs).
 * To go live: set true and rename src/pages/_subscribe back to src/pages/subscribe.
 */
export const SUBSCRIBE_ENABLED = false

export const LISTMONK_URL = 'https://list.bitsbytesgates.com'
export const LISTMONK_LIST_UUID: string = ''

/** Where Listmonk sends a no-JS signup afterwards. Must be in Listmonk's Security → Trusted URLs. */
export const SUBSCRIBE_THANKS_URL = 'https://bitsbytesgates.com/subscribe/thanks/'
