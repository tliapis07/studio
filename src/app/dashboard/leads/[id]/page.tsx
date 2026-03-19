import LeadDetailClient from './LeadDetailClient';

/**
 * @fileOverview Lead Detail Page (Server Component)
 * 
 * Production Configuration for Static Export:
 * - dynamicParams = false (Requires all routes to be defined at build time or handled client-side)
 * - generateStaticParams: Returns empty array to support dynamic client-side hydration via Firestore.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  // Required for Next.js 15+ static export. 
  // We return empty because actual lead IDs are unknown at build time
  // and are loaded client-side via the [id] param from LeadDetailClient.
  return []; 
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <LeadDetailClient id={id} />
  );
}
