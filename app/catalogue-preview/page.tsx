import { notFound } from 'next/navigation'
import { CataloguePreview } from '@/components/academics/catalogue-preview'
export default function CataloguePreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <CataloguePreview />
}
