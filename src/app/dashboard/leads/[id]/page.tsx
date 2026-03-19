import LeadDetailClient from './LeadDetailClient';

/**
 * @fileOverview Lead Detail Page (Server Component)
 * 
 * This component acts as the entry point for lead details. For Next.js 15 static 
 * export compatibility, we use generateStaticParams and dynamicParams = false.
 */

// Required for static export with dynamic routes
export const dynamicParams = false;

export async function generateStaticParams() {
  // In a Capacitor/static environment, we return an empty array or a set of 
  // known IDs to satisfy the build process. All lead data is fetched client-side.
  return []; 
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15, params is a Promise
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <LeadDetailClient id={id} />
  );
}
