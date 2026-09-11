/**
 * Lichte opmaak voor de introtekst — geen editor of dependency nodig. Een
 * lege regel breekt een alinea af; regels die met "- " beginnen vormen een
 * opsommingslijst, ook als ze direct op een gewone regel volgen (bv. een
 * inleidende zin gevolgd door bullets, zonder lege regel ertussen).
 */
type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

function parseIntro(text: string): Block[] {
  const blocks: Block[] = [];
  let textLines: string[] = [];
  let bulletItems: string[] = [];

  function flushText() {
    if (textLines.length > 0) {
      blocks.push({ type: "p", text: textLines.join(" ") });
      textLines = [];
    }
  }

  function flushBullets() {
    if (bulletItems.length > 0) {
      blocks.push({ type: "ul", items: bulletItems });
      bulletItems = [];
    }
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flushText();
      flushBullets();
    } else if (line.startsWith("- ")) {
      flushText();
      bulletItems.push(line.slice(2));
    } else {
      flushBullets();
      textLines.push(line);
    }
  }
  flushText();
  flushBullets();

  return blocks;
}

export function IntroContent({ text }: { text: string }) {
  const blocks = parseIntro(text);

  return (
    <div className="space-y-3 text-lg text-muted-foreground">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1 pl-5 text-left">
            {block.items.map((item, li) => (
              <li key={li}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block.text}</p>
        ),
      )}
    </div>
  );
}
