'use server';
/**
 * @fileOverview A Genkit flow to summarize a lead's activity history.
 *
 * - summarizeLeadActivity - A function that handles summarizing a lead's activity.
 * - SummarizeLeadActivityInput - The input type for the summarizeLeadActivity function.
 * - SummarizeLeadActivityOutput - The return type for the summarizeLeadActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Lead, Activity} from '@/lib/types';

const LeadSchema = z.object({
  id: z.string(),
  ownerUid: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  tags: z.array(z.string()),
  leadScore: z.number().int(),
  nextFollowUpAt: z.date().optional(),
  lastContactAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  customFields: z.record(z.any()),
  notesCount: z.number().int(),
  callsCount: z.number().int(),
});

const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['note', 'call', 'status_change', 'tag_added']),
  content: z.string(),
  createdAt: z.date(),
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
});

const SummarizeLeadActivityInputSchema = z.object({
  lead: LeadSchema,
  activities: z.array(ActivitySchema),
});
export type SummarizeLeadActivityInput = z.infer<typeof SummarizeLeadActivityInputSchema>;

const SummarizeLeadActivityOutputSchema = z.string().describe('A concise summary of the lead\'s history and activities.');
export type SummarizeLeadActivityOutput = z.infer<typeof SummarizeLeadActivityOutputSchema>;

export async function summarizeLeadActivity(input: SummarizeLeadActivityInput): Promise<SummarizeLeadActivityOutput> {
  return summarizeLeadActivityFlow(input);
}

const summarizeLeadActivityPrompt = ai.definePrompt({
  name: 'summarizeLeadActivityPrompt',
  input: {schema: SummarizeLeadActivityInputSchema},
  output: {schema: SummarizeLeadActivityOutputSchema},
  prompt: `You are an expert sales CRM assistant. Your task is to provide a concise summary of a lead's history and activities, enabling a sales representative to quickly catch up and prepare for engagements.

To do this, you will proceed SYSTEMATICALLY and take your time:
1. Read the full lead details and activity log carefully.
2. Think step by step about the most important interactions, status changes, and notes.
3. Reason about the overall trajectory of the lead, key milestones, and critical information for future engagement.
4. Only then give a clear, professional, and actionable summary.

Lead Details:
- Name: {{{lead.name}}}
- Email: {{{lead.email}}}
- Phone: {{{lead.phone}}}
- Company: {{{lead.company}}}
- Current Status: {{{lead.status}}}
- Lead Score: {{{lead.leadScore}}}
- Tags: {{#each lead.tags}}- {{{this}}}
{{/each}}
- Created At: {{{lead.createdAt}}}
- Last Contact At: {{{lead.lastContactAt}}}
- Next Follow Up At: {{{lead.nextFollowUpAt}}}

Activity Log:
{{#if activities}}
{{#each activities}}
- Type: {{{type}}}
- Content: {{{content}}}
- Date: {{{createdAt}}}
{{#if oldStatus}}- Old Status: {{{oldStatus}}}{{/if}}
{{#if newStatus}}- New Status: {{{newStatus}}}{{/if}}
---
{{/each}}
{{else}}
No activities recorded.
{{/if}}

Provide a summary that highlights key interactions, decisions, and future opportunities or risks.
`
});

const summarizeLeadActivityFlow = ai.defineFlow(
  {
    name: 'summarizeLeadActivityFlow',
    inputSchema: SummarizeLeadActivityInputSchema,
    outputSchema: SummarizeLeadActivityOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeLeadActivityPrompt(input);
    return output!;
  }
);
