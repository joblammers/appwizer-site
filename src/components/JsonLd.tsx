/**
 * Structured data (schema.org) als JSON-LD. `<` wordt geëscaped zodat een
 * waarde nooit de script-tag kan afsluiten.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
