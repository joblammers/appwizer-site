"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  createCase,
  deleteCase,
  updateCase,
  type ClientCase,
} from "@/lib/cases";

export interface CaseActionResult {
  ok: boolean;
  errors: string[];
}

function validateCase(input: Omit<ClientCase, "id">): string[] {
  const errors: string[] = [];
  if (!input.client.trim()) errors.push("Klantnaam is verplicht.");
  if (!input.location.trim()) errors.push("Plaats is verplicht.");
  if (!input.period.trim()) errors.push("Periode is verplicht.");
  if (!input.duration.trim()) errors.push("Duur is verplicht.");
  if (!input.sector.trim()) errors.push("Sector is verplicht.");
  if (!input.descriptionNl.trim()) errors.push("Beschrijving (NL) is verplicht.");
  return errors;
}

function revalidateCasePaths() {
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveCaseAction(
  id: number | null,
  input: Omit<ClientCase, "id">,
): Promise<CaseActionResult> {
  await requireAdminSession();

  const errors = validateCase(input);
  if (errors.length > 0) return { ok: false, errors };

  try {
    if (id === null) {
      await createCase(input);
    } else {
      await updateCase(id, input);
    }
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Opslaan mislukt."],
    };
  }

  revalidateCasePaths();
  return { ok: true, errors: [] };
}

export async function deleteCaseAction(id: number): Promise<void> {
  await requireAdminSession();
  await deleteCase(id);
  revalidateCasePaths();
}
