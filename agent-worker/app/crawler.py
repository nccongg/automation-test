"""
Site crawler using Playwright.

Flow:
  1. Launch browser (headless Chromium)
  2. Authenticate if auth config is provided (form login or cookie injection)
  3. BFS crawl from base_url up to max_pages / max_depth
  4. For each page: extract title, child links, forms, buttons, navigation
  5. Return { sitemap, interaction_map }
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from playwright.async_api import async_playwright, Page

logger = logging.getLogger(__name__)


class SiteCrawler:
    def __init__(
        self,
        base_url: str,
        auth_config: Optional[Dict[str, Any]] = None,
        max_pages: int = 30,
        max_depth: int = 3,
        progress_callback_url: Optional[str] = None,
        progress_callback_secret: str = "",
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.base_domain = urlparse(base_url).netloc
        self.auth_config = auth_config
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.progress_callback_url = progress_callback_url
        self.progress_callback_secret = progress_callback_secret

        self.visited: set[str] = set()
        self.sitemap: List[Dict[str, Any]] = []
        self.interaction_map: Dict[str, Any] = {}

        logger.info("SiteCrawler initialized: base_url=%s, base_domain=%s, max_pages=%d, max_depth=%d, callback_url=%s",
                   self.base_url, self.base_domain, max_pages, max_depth, 
                   progress_callback_url or "none")

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    async def crawl(self) -> Dict[str, Any]:
        logger.info("Starting crawl: base_url=%s, max_pages=%d, max_depth=%d",
                   self.base_url, self.max_pages, self.max_depth)

        async with async_playwright() as p:
            logger.debug("Launching Playwright browser")
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (compatible; AutomationTestCrawler/1.0)"
                )
            )
            page = await context.new_page()

            if self.auth_config:
                await self._authenticate(page)

            logger.info("Starting BFS crawl from %s", self.base_url)
            await self._crawl_page(page, self.base_url, depth=0)
            await browser.close()
            logger.info("Browser closed")

        logger.info(
            "Crawl complete: %d pages visited, %d interactions extracted",
            len(self.sitemap),
            len(self.interaction_map),
        )
        return {
            "sitemap": self.sitemap,
            "interaction_map": self.interaction_map,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Authentication
    # ──────────────────────────────────────────────────────────────────────────

    async def _authenticate(self, page: Page) -> None:
        auth = self.auth_config
        auth_type = auth.get("type")

        logger.info("Starting authentication: type=%s", auth_type)
        if auth_type == "form":
            await self._form_login(page, auth)
        elif auth_type == "cookie":
            await self._inject_cookies(page, auth)
        else:
            logger.warning("Unknown auth type: %s — skipping auth", auth_type)

    async def _form_login(self, page: Page, auth: Dict[str, Any]) -> None:
        login_url = auth["loginUrl"]
        if not login_url.startswith("http"):
            login_url = urljoin(self.base_url, login_url)

        logger.info("Form login: navigating to %s", login_url)
        await page.goto(login_url, wait_until="domcontentloaded", timeout=30_000)
        logger.info("Form login: page loaded, filling credentials")

        await page.fill(auth["usernameSelector"], auth["username"])
        logger.info("Form login: username filled")

        await page.fill(auth["passwordSelector"], auth["password"])
        logger.info("Form login: password filled")

        logger.info("Form login: clicking submit button")
        await page.click(auth["submitSelector"])

        # Wait for navigation after submit
        if auth.get("successSelector"):
            logger.info("Form login: waiting for success selector: %s", auth["successSelector"])
            await page.wait_for_selector(auth["successSelector"], timeout=10_000)
        else:
            logger.info("Form login: waiting for network idle")
            await page.wait_for_load_state("networkidle", timeout=10_000)

        logger.info("Form login complete — current URL: %s", page.url)

    async def _inject_cookies(self, page: Page, auth: Dict[str, Any]) -> None:
        cookies = [
            {
                "name": c["name"],
                "value": c["value"],
                "url": self.base_url,
            }
            for c in auth.get("cookies", [])
        ]
        logger.info("Injecting %d cookies: %s", len(cookies), [c["name"] for c in cookies])
        await page.context.add_cookies(cookies)
        logger.info("Cookies injected successfully")

    # ──────────────────────────────────────────────────────────────────────────
    # BFS Crawl
    # ──────────────────────────────────────────────────────────────────────────

    async def _crawl_page(self, page: Page, url: str, depth: int) -> None:
        if depth > self.max_depth:
            logger.debug("Skipping %s: depth %d > max_depth %d", url, depth, self.max_depth)
            return
        if len(self.visited) >= self.max_pages:
            logger.debug("Skipping %s: max_pages %d reached", url, self.max_pages)
            return

        normalized = self._normalize_url(url)
        if not normalized or normalized in self.visited:
            logger.debug("Skipping %s: already visited or invalid", url)
            return

        self.visited.add(normalized)
        logger.info("[depth=%d] Crawling: %s", depth, normalized)

        try:
            logger.debug("Navigating to %s", normalized)
            await page.goto(normalized, wait_until="domcontentloaded", timeout=30_000)
            logger.debug("Page loaded successfully")
        except Exception as exc:
            logger.warning("Failed to load %s: %s", normalized, exc)
            return

        title = await page.title()
        logger.debug("Page title: %s", title)

        interactions = await self._extract_interactions(page)
        logger.debug("Extracted interactions: forms=%d, buttons=%d, navigation=%d",
                    len(interactions.get("forms", [])),
                    len(interactions.get("buttons", [])),
                    len(interactions.get("navigation", [])))

        child_urls = await self._extract_links(page)
        logger.debug("Found %d child URLs", len(child_urls))

        page_info = {
            "url": normalized,
            "title": title,
            "depth": depth,
            "childUrls": child_urls[:20],
        }
        self.sitemap.append(page_info)
        self.interaction_map[normalized] = interactions

        # Report this page to the server immediately so the UI updates live
        await self._report_progress(page_info)

        for child_url in child_urls:
            if len(self.visited) >= self.max_pages:
                logger.info("Max pages reached, stopping crawl")
                break
            await self._crawl_page(page, child_url, depth + 1)

    async def _report_progress(self, page_info: Dict[str, Any]) -> None:
        if not self.progress_callback_url:
            logger.debug("No progress callback URL configured")
            return
        payload = {
            "url": page_info["url"],
            "title": page_info["title"],
            "depth": page_info["depth"],
            "pageIndex": len(self.sitemap),  # 1-based count so far
        }
        logger.debug("Reporting progress: page %d - %s", payload["pageIndex"], payload["url"])
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    self.progress_callback_url,
                    json=payload,
                    headers={"x-callback-secret": self.progress_callback_secret},
                )
            logger.debug("Progress reported successfully")
        except Exception as exc:
            logger.debug("Progress callback failed (non-fatal): %s", exc)

    async def _extract_links(self, page: Page) -> List[str]:
        logger.debug("Extracting links from page")
        raw_links: List[str] = await page.evaluate(
            """() =>
                Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(h => h && !h.startsWith('javascript:') && !h.startsWith('mailto:') && !h.startsWith('tel:'))
            """
        )

        logger.debug("Found %d raw links on page", len(raw_links))
        seen: set[str] = set()
        result: List[str] = []
        for link in raw_links:
            normalized = self._normalize_url(link)
            if normalized and normalized not in self.visited and normalized not in seen:
                seen.add(normalized)
                result.append(normalized)

        logger.debug("Normalized to %d unique links", len(result))
        return result

    async def _extract_interactions(self, page: Page) -> Dict[str, Any]:
        logger.debug("Extracting interactions from page")
        interactions = await page.evaluate(
            """() => {
                const result = { forms: [], buttons: [], inputs: [], navigation: [] };

                // Forms
                document.querySelectorAll('form').forEach(form => {
                    const fields = [];
                    form.querySelectorAll('input, select, textarea').forEach(el => {
                        if (el.type === 'hidden') return;
                        const label = el.labels?.[0]?.textContent?.trim()
                            || el.getAttribute('placeholder')
                            || el.name
                            || el.id
                            || '';
                        fields.push({
                            tag: el.tagName.toLowerCase(),
                            type: el.type || el.tagName.toLowerCase(),
                            name: el.name || el.id || '',
                            label,
                        });
                    });
                    result.forms.push({
                        id: form.id || '',
                        action: form.getAttribute('action') || '',
                        method: (form.method || 'get').toLowerCase(),
                        fields,
                    });
                });

                // Buttons (deduplicated by text)
                const btnSeen = new Set();
                document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').forEach(btn => {
                    const text = (btn.textContent?.trim() || btn.value || '').slice(0, 80);
                    if (!text || btnSeen.has(text)) return;
                    btnSeen.add(text);
                    result.buttons.push({ text, type: btn.type || '', id: btn.id || '' });
                });

                // Navigation links
                document.querySelectorAll('nav a, [role="navigation"] a, header a').forEach(a => {
                    const text = a.textContent?.trim() || '';
                    if (text) {
                        result.navigation.push({ text, href: a.href || '' });
                    }
                });

                return result;
            }"""
        )
        logger.debug("Extracted: %d forms, %d buttons, %d nav items",
                    len(interactions.get("forms", [])),
                    len(interactions.get("buttons", [])),
                    len(interactions.get("navigation", [])))
        return interactions

    # ──────────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _normalize_url(self, url: str) -> Optional[str]:
        try:
            parsed = urlparse(url)
        except Exception as e:
            logger.debug("Failed to parse URL %s: %s", url, e)
            return None

        # Only follow same-domain URLs
        if parsed.netloc and parsed.netloc != self.base_domain:
            logger.debug("Rejecting cross-domain URL %s (domain=%s, base=%s)", 
                        url, parsed.netloc, self.base_domain)
            return None

        # Rebuild without fragment
        scheme = parsed.scheme or "https"
        netloc = parsed.netloc or self.base_domain
        path = parsed.path or "/"
        query = f"?{parsed.query}" if parsed.query else ""
        normalized = f"{scheme}://{netloc}{path}{query}"
        logger.debug("Normalized %s to %s", url, normalized)
        return normalized
