// Server component for emitting JSON-LD as <script type="application/ld+json">.
// Single source-of-truth so we don't sprinkle dangerouslySetInnerHTML across
// the app. Sprint 7 may switch this to nonce-based when CSP lands.

type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
