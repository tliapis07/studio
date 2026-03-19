import LeadDetailClient from './LeadDetailClient';

/**
 * @fileOverview Lead Detail Page (Server Component)
 * 
 * This component acts as the entry point for lead details. It handles static 
 * parameter generation for the build process and passes the lead ID to the 
 * client-side interactive component.
 */

export async function generateStaticParams() {
  // In a static export environment, we return an empty array if we intend 
  // to fetch all data on the client, or a list of known IDs to pre-render.
  return []; 
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <LeadDetailClient id={id} />
  );
}
