import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import Link from "next/link";
import { FAQ, type FaqItem } from "@/lib/faq";

function Answer({ item }: { item: FaqItem }) {
  const { answer, link } = item;
  const at = link ? answer.indexOf(link.phrase) : -1;
  if (!link || at === -1) return <>{answer}</>;
  return (
    <>
      {answer.slice(0, at)}
      <Link href={link.href} className="font-medium text-appwizer-orange underline underline-offset-2">
        {link.phrase}
      </Link>
      {answer.slice(at + link.phrase.length)}
    </>
  );
}

const heading = "font-[family-name:var(--font-space-grotesk)]";

/** Zichtbare FAQ met native <details> (antwoorden staan in de HTML, ook ingeklapt) plus bijbehorende FAQPage-markup. */
export function FaqSection() {
  return (
    <div id="faq" className="mx-auto max-w-[820px] px-6 py-[clamp(56px,10vw,100px)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <div className="mb-10 text-center">
        <div className="mb-3 text-[13px] font-bold tracking-[0.06em] text-appwizer-orange">
          VEELGESTELDE VRAGEN
        </div>
        <h2 className={`m-0 text-[clamp(26px,4vw,34px)] font-bold tracking-[-0.02em] ${heading}`}>
          Antwoorden op je vragen
        </h2>
      </div>
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-border bg-surface px-5 py-4 open:pb-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              <h3 className="m-0 text-base font-semibold">{item.question}</h3>
              <ChevronDown
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-[15px] leading-[1.65] text-muted-foreground"><Answer item={item} /></p>
          </details>
        ))}
      </div>
    </div>
  );
}
