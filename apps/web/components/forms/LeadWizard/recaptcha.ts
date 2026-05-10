// Lazy reCAPTCHA v3 loader. Inserts the script once on first call;
// subsequent calls reuse the global. When the site key is missing or a
// XXX_ placeholder we resolve to an empty string — the server-side
// verifyRecaptcha() then takes the dev_bypass branch.

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let _scriptLoaded = false;

function siteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!key || key.startsWith("XXX_")) return null;
  return key;
}

function loadScript(key: string): Promise<void> {
  if (_scriptLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      _scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("recaptcha_script_failed_to_load"));
    document.head.appendChild(script);
  });
}

export async function executeRecaptcha(action: string): Promise<string> {
  const key = siteKey();
  // Dev placeholder: server's verifyRecaptcha checks the SECRET key env
  // first and dev_bypasses regardless of token content. Sending a non-
  // empty placeholder satisfies the API's Zod min(1) constraint.
  if (!key) return "dev-bypass-token";

  await loadScript(key);
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("recaptcha_not_initialised"));
      return;
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha!.execute(key, { action }).then(resolve).catch(reject);
    });
  });
}
