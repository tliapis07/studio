import LeadDetailClient from './LeadDetailClient';

/**
 * @fileOverview Lead Detail Page (Server Component)
 * 
 * This component acts as the entry point for lead details. For Next.js 15/16 static 
 * export compatibility, we use generateStaticParams and dynamicParams = false.
 */

// Required for static export with dynamic routes
export const dynamicParams = false;

export async function generateStaticParams() {
  // In a Capacitor/static environment, we return an empty array to satisfy the build process.
  // Dynamic leads will be handled client-side via Firestore listeners in the Client Component.
  return []; 
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15+, params is a Promise
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <LeadDetailClient id={id} />
  );
}
