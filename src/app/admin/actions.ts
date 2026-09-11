"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  deleteScan as deleteScanFromStore,
  getScans,
  saveScan as saveScanToStore,
} from "@/lib/quickscan/scans";
import type { Scan } from "@/lib/quickscan/types";
import { validateScan } from "@/lib/quickscan/validate";

export interface ScanActionResult {
  ok: boolean;
  errors: string[];
}

function revalidateScanPaths(slug: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/${slug}`);
  revalidatePath("/");
  revalidatePath(`/${slug}`);
}

export async function saveScanAction(
  scan: Scan,
  previousSlug: string,
): Promise<ScanActionResult> {
  await requireAdminSession();

  const errors = validateScan(scan);
  if (errors.length > 0) return { ok: false, errors };

  const existing = await getScans();
  const clash = existing.find(
    (s) => s.slug === scan.slug && s.slug !== previousSlug,
  );
  if (clash) {
    return { ok: false, errors: [`Slug "${scan.slug}" is al in gebruik.`] };
  }

  try {
    await saveScanToStore(scan, previousSlug);
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Opslaan mislukt."],
    };
  }

  revalidateScanPaths(previousSlug);
  revalidateScanPaths(scan.slug);
  return { ok: true, errors: [] };
}

export async function createScanAction(
  scan: Scan,
): Promise<ScanActionResult> {
  await requireAdminSession();

  const errors = validateScan(scan);
  if (errors.length > 0) return { ok: false, errors };

  const existing = await getScans();
  if (existing.some((s) => s.slug === scan.slug)) {
    return { ok: false, errors: [`Slug "${scan.slug}" is al in gebruik.`] };
  }

  try {
    await saveScanToStore(scan);
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Aanmaken mislukt."],
    };
  }

  revalidateScanPaths(scan.slug);
  redirect(`/admin/${scan.slug}`);
}

export async function deleteScanAction(slug: string): Promise<void> {
  await requireAdminSession();
  await deleteScanFromStore(slug);
  revalidateScanPaths(slug);
  redirect("/admin");
}
