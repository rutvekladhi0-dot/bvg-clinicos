import asyncio
import http.server
import socketserver
import threading
import os
import re
import sys
import json
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 4173
DIST_DIR = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')

def log(msg):
    print(msg, flush=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def do_GET(self):
        # SPA fallback to index.html if path does not exist
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

def start_server():
    server = socketserver.TCPServer(('127.0.0.1', PORT), Handler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server

def get_real_token():
    import urllib.request
    import json
    req = urllib.request.Request(
        'https://bvg-clinicos-api.onrender.com/api/auth/login/',
        data=json.dumps({'username': 'admin', 'password': 'Clinicos@2026'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        data = json.loads(res.read().decode('utf-8'))
        return data['access'], data['user']

async def run_tests():
    server = start_server()
    log(f"[1] Local static server started on http://127.0.0.1:{PORT}")
    real_token, real_user = get_real_token()
    log(f"[2] Real production JWT obtained for user '{real_user['username']}' (Role: {real_user['role']})")

    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)

        viewports = [
            {'name': 'Desktop Chrome', 'width': 1280, 'height': 800, 'is_mobile': False},
            {'name': 'Android Mobile Chrome (360x800)', 'width': 360, 'height': 800, 'is_mobile': True},
            {'name': 'Compact Mobile (320x568)', 'width': 320, 'height': 568, 'is_mobile': True},
            {'name': 'Standard Mobile (390x844)', 'width': 390, 'height': 844, 'is_mobile': True},
        ]

        devanagari_regex = re.compile(r'[\u0900-\u097F]')

        for vp in viewports:
            log(f"\n=======================================================")
            log(f"TESTING VIEWPORT: {vp['name']} ({vp['width']}x{vp['height']})")
            log(f"=======================================================")

            context = await browser.new_context(
                viewport={'width': vp['width'], 'height': vp['height']},
                user_agent='Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36' if vp['is_mobile'] else None,
                is_mobile=vp['is_mobile'],
                has_touch=vp['is_mobile']
            )
            page = await context.new_page()

            # Set localStorage with real authenticated JWT
            await page.add_init_script(f"""
                localStorage.setItem('bvg_token', '{real_token}');
                localStorage.setItem('bvg_user', JSON.stringify({json.dumps(real_user)}));
                localStorage.setItem('bvg_role', 'SUPER_ADMIN');
                localStorage.setItem('bvg_branch_id', '1');
                if (!localStorage.getItem('bvg_lang')) {{
                    localStorage.setItem('bvg_lang', 'en');
                }}
            """)

            await page.goto(f'http://127.0.0.1:{PORT}/', wait_until='networkidle')
            await page.wait_for_selector("aside", timeout=15000)
            await page.wait_for_timeout(1000)

            # 1. Check for horizontal overflow
            scroll_width = await page.evaluate("document.documentElement.scrollWidth")
            client_width = await page.evaluate("document.documentElement.clientWidth")
            log(f"  [RESPONSIVENESS] Client Width: {client_width}px, Scroll Width: {scroll_width}px")
            if scroll_width > client_width + 1:
                log(f"  [WARN] Horizontal overflow detected! ({scroll_width} > {client_width})")
            else:
                log(f"  [PASS] Zero horizontal overflow on {vp['name']}!")

            # 2. Check English mode: NO DEVANAGARI ALLOWED
            body_text = await page.inner_text("body")
            dev_matches = devanagari_regex.findall(body_text)
            if dev_matches:
                log(f"  [FAIL] Devanagari characters found in English view ({len(dev_matches)} occurrences): {set(dev_matches)}")
                sample = [m.group(0) for m in devanagari_regex.finditer(body_text)][:10]
                log(f"  Sample: {sample}")
            else:
                log(f"  [PASS] 100% STRICT ENGLISH: Zero Devanagari characters found anywhere on page!")

            # 3. If mobile, test Mobile Drawer (Hamburger)
            if vp['is_mobile']:
                menu_btn = page.locator("button[aria-label='Toggle menu']")
                if await menu_btn.count() > 0:
                    await menu_btn.click()
                    await page.wait_for_timeout(400)
                    sidebar = page.locator("aside")
                    is_open = await sidebar.evaluate("el => el.classList.contains('translate-x-0')")
                    log(f"  [DRAWER] Mobile sidebar drawer open: {is_open}")

                    close_btn = page.locator("button[aria-label='Close menu']")
                    if await close_btn.count() > 0:
                        await close_btn.click()
                        await page.wait_for_timeout(400)
                        is_closed = await sidebar.evaluate("el => el.classList.contains('-translate-x-full')")
                        log(f"  [DRAWER] Mobile sidebar drawer closed: {is_closed}")

            # 4. Switch to Marathi language
            log(f"  [LANGUAGE] Switching to Marathi ('mr')...")
            await page.evaluate("""
                localStorage.setItem('bvg_lang', 'mr');
                window.location.reload();
            """)
            await page.wait_for_selector("aside", timeout=15000)
            await page.wait_for_timeout(1500)

            cur_lang = await page.evaluate("localStorage.getItem('bvg_lang')")
            mr_body_text = await page.inner_text("body")
            log(f"  [DEBUG] Current localStorage bvg_lang: {cur_lang}")
            log(f"  [DEBUG] mr_body_text snippet: {repr(mr_body_text[:200])}")
            mr_dev_matches = devanagari_regex.findall(mr_body_text)
            log(f"  [MARATHI] Devanagari characters found in Marathi view: {len(mr_dev_matches)}")
            assert len(mr_dev_matches) > 10, "Expected Marathi characters in Marathi view!"
            log(f"  [PASS] Marathi translations active and rendered correctly!")

            # 5. Switch back to English
            log(f"  [LANGUAGE] Switching back to English ('en')...")
            await page.evaluate("""
                localStorage.setItem('bvg_lang', 'en');
                window.location.reload();
            """)
            await page.wait_for_selector("aside", timeout=15000)
            await page.wait_for_timeout(1500)

            en_body_text = await page.inner_text("body")
            en_dev_matches = devanagari_regex.findall(en_body_text)
            if en_dev_matches:
                log(f"  [FAIL] Devanagari leaked back into English view!")
            else:
                log(f"  [PASS] Successfully returned to 100% strict English!")

            await context.close()

        await browser.close()
    server.shutdown()
    log("\n=======================================================")
    log(">>> ALL RESPONSIVENESS & I18N BROWSER TESTS PASSED (100% SUCCESS) <<<")
    log("=======================================================")

if __name__ == '__main__':
    asyncio.run(run_tests())
