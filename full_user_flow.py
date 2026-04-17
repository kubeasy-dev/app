from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # 1. Home page
            print("Navigating to Home (/)...")
            page.goto('https://kubeasy.dev', timeout=60000)
            page.wait_for_load_state('domcontentloaded')
            time.sleep(2)
            
            # 2. Challenges list
            print("Navigating to Challenges (/challenges)...")
            page.goto('https://kubeasy.dev/challenges', timeout=60000)
            page.wait_for_load_state('domcontentloaded')
            time.sleep(3)
            
            # 3. Specific challenge
            links = page.locator('a').all()
            challenge_links = [l for l in links if l.get_attribute('href') and '/challenges/' in l.get_attribute('href') and len(l.get_attribute('href').strip('/')) > len('challenges')]
            
            if challenge_links:
                target = challenge_links[0]
                href = target.get_attribute('href')
                print(f"Navigating to specific challenge ({href})...")
                page.goto(f'https://kubeasy.dev{href}' if href.startswith('/') else href, timeout=60000)
                page.wait_for_load_state('domcontentloaded')
                time.sleep(3)
                print(f"Final URL: {page.url}")
            else:
                print("No challenge links found.")
                
        except Exception as e:
            print(f"Error during navigation: {e}")
        finally:
            browser.close()

if __name__ == '__main__':
    run()
