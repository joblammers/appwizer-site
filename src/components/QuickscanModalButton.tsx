"use client";

import { useState } from "react";
import type { Scan } from "@/lib/quickscan/types";
import { Modal } from "@/components/Modal";
import { ScanRunner } from "@/components/quickscan/ScanRunner";

/**
 * Opent de quickscan in een lightbox (zoals de Cal.com-popup), in plaats van
 * weg te navigeren naar /mkb — de ScanRunner draait dan gewoon binnen de
 * modal, geen iframe nodig omdat het dezelfde app is.
 */
export function QuickscanModalButton({
  scan,
  label,
  className,
  peerScores,
}: {
  scan: Scan;
  label: string;
  className: string;
  /** Gemiddelde score per categoriecode van andere deelnemers van déze scan — zie getCategoryAverages(). */
  peerScores?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} ariaLabel={scan.title} maxWidthClassName="max-w-3xl">
          <ScanRunner scan={scan} peerScores={peerScores} />
        </Modal>
      )}
    </>
  );
}
