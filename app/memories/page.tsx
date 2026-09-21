import type { Metadata } from 'next';
import MemoriesGallery from '@/components/memories/MemoriesGallery';

export const metadata: Metadata = {
  title: 'Explore Memories',
  description: 'A collection of little moments worth keeping forever.',
};

export default function MemoriesPage() {
  return <MemoriesGallery />;
}