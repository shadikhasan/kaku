import KakuApp from '@/components/kaku-app';
import type { View } from '@/lib/types';

export const dynamicParams = false;

export function generateStaticParams() {
  return ['lessons', 'library', 'review', 'progress', 'settings', 'practice'].map(view => ({ view }));
}

export default async function Page({ params }: { params: Promise<{ view: View }> }) {
  const { view } = await params;
  return <KakuApp initialView={view} />;
}
