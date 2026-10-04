'use server';
import 'server-only';
import { revalidatePath } from 'next/cache';

/** Invalidate account route data after confirmed API mutations, before navigating. */
export async function refreshAccountRoutes() {
  revalidatePath('/workspace', 'layout');
  revalidatePath('/(account)', 'layout');
}
