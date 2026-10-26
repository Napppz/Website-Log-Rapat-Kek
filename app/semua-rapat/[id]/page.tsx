import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function RedirectSemuaRapatDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const query = new URLSearchParams(
    Object.entries(sParams).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();
  redirect(query ? `/arsip-kegiatan/${id}?${query}` : `/arsip-kegiatan/${id}`);
}
