import { headers } from "next/headers";

// Async server component for emitting JSON-LD as <script type="application/ld+json">.
// Reads the CSP nonce set by middleware.ts so the inline script passes the
// strict 'script-src 'self' 'nonce-…' 'strict-dynamic'' policy. Single
// source-of-truth — never sprinkle dangerouslySetInnerHTML elsewhere.

type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export default async function JsonLd({ data }: Props) {
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
