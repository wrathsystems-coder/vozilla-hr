const COOKIEBOT_ID = process.env.NEXT_PUBLIC_COOKIEBOT_ID;

export default function CookieBanner() {
  if (!COOKIEBOT_ID || COOKIEBOT_ID.startsWith("XXX_")) return null;

  return (
    <script
      id="Cookiebot"
      src="https://consent.cookiebot.com/uc.js"
      data-cbid={COOKIEBOT_ID}
      data-blockingmode="auto"
      type="text/javascript"
      async
    />
  );
}
