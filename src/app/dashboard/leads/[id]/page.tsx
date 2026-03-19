import LeadDetailClient from './LeadDetailClient';

/**
 * @fileOverview Lead Detail Page (Server Component)
 * 
 * Entry point for dynamic lead details. Configured for Next.js 15+ 
 * static export compatibility.
 */

// Required for static export with dynamic routes.
export const dynamicParams = false;

export async function generateStaticParams() {
  // Return an empty array to satisfy the build process for static export.
  // Dynamic IDs are handled client-side via Firestore listeners in LeadDetailClient.
  return []; 
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <LeadDetailClient id={id} />
  );
}
