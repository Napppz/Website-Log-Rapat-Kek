import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RapatRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/arsip-kegiatan/${id}`);
}
