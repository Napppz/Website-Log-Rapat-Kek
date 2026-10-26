import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RedirectBuatRapat({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();
  redirect(query ? `/catat-kegiatan?${query}` : '/catat-kegiatan');
}
