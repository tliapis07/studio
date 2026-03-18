'use server';
/**
 * @fileOverview A Genkit flow that suggests the most appropriate next sales action for a given lead.
 *
 * - suggestLeadNextAction - A function that suggests the next sales action based on lead data and activity history.
 * - SuggestLeadNextActionInput - The input type for the suggestLeadNextAction function.
 * - SuggestLeadNextActionOutput - The return type for the suggestLeadNextAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Lead, Activity } from '@/lib/types'; // Import Lead and Activity interfaces

// Define Zod schemas that mirror the Lead and Activity interfaces
const LeadSchema = z.object({
  id: z.string(),
  ownerUid: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  tags: z.array(z.string()),
  leadScore: z.number(),
  nextFollowUpAt: z.date().optional(), // Expected to be Date object or null/undefined
  lastContactAt: z.date().optional(),   // Expected to be Date object or null/undefined
  createdAt: z.date(),
  updatedAt: z.date(),
  customFields: z.record(z.any()).describe('A map of custom fields for the lead.'),
  notesCount: z.number(),
  callsCount: z.number(),
});

const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['note', 'call', 'status_change', 'tag_added']),
  content: z.string(),
  createdAt: z.date(), // Expected to be Date object
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
});

// Input schema for the Genkit flow
const SuggestLeadNextActionInputSchema = z.object({
  lead: LeadSchema.describe('The current lead object, containing all relevant details.'),
  activities: z.array(ActivitySchema).describe('A chronologically ordered list of recent activities related to the lead.'),
});
export type SuggestLeadNextActionInput = z.infer<typeof SuggestLeadNextActionInputSchema>;

// Output schema for the Genkit flow
const SuggestLeadNextActionOutputSchema = z.object({
  suggestedAction: z.string().describe('A clear, professional, and actionable next sales action for the lead.'),
  reasoning: z.string().describe('The step-by-step reasoning and thought process behind the suggested action.'),
});
export type SuggestLeadNextActionOutput = z.infer<typeof SuggestLeadNextActionOutputSchema>;

// Define the Genkit prompt for suggesting the next sales action
const suggestLeadNextActionPrompt = ai.definePrompt({
  name: 'suggestLeadNextActionPrompt',
  input: { schema: SuggestLeadNextActionInputSchema },
  output: { schema: SuggestLeadNextActionOutputSchema },
  prompt: `You are an expert sales CRM assistant, specifically trained to analyze lead data and suggest optimal next sales actions.

Your primary goal is to help sales representatives optimize their strategy by providing the most appropriate next sales action for a given lead, along with comprehensive reasoning.

Process the request SYSTEMATICALLY and take your time:
1. Read the full context carefully, focusing on the lead's current status, lead score, last contact date, next follow-up date, and the entire activity history.
2. Think step by step about the lead's journey through the sales pipeline. Evaluate past interactions and current indicators to identify potential blockers or opportunities.
3. Reason about the best sales outcome for this specific lead, aiming to move them forward in the pipeline efficiently. Consider strategies such as targeted follow-ups, further qualification, scheduling demos, sending proposals, or preparing for closure.
4. Only after a thorough and reasoned analysis, formulate a clear, professional, and actionable suggested next sales action and provide the detailed, step-by-step reasoning behind your recommendation.
Do not rush your analysis.

Current Lead Information:
------------------------
ID: {{{lead.id}}}
Name: {{{lead.name}}}
Company: {{{lead.company}}}
Status: {{{lead.status}}}
Lead Score: {{{lead.leadScore}}}
Last Contact: {{lead.lastContactAt}}
Next Follow Up: {{lead.nextFollowUpAt}}
Tags: {{#if lead.tags}}{{#each lead.tags}}  - {{{this}}}
{{/each}}{{else}}  No tags.{{/if}}
Email: {{lead.email}}
Phone: {{lead.phone}}
{{#if lead.customFields}}Custom Fields: {{{JSON.stringify lead.customFields}}}{{/if}}

Recent Activities (ordered chronologically from oldest to newest):
------------------------------------------------------------------
{{#if activities}}{{#each activities}}
- Type: {{{type}}}
  Content: {{{content}}}
  Created At: {{{createdAt}}}
  {{#if oldStatus}}  Old Status: {{{oldStatus}}}{{/if}}
  {{#if newStatus}}  New Status: {{{newStatus}}}{{/if}}
{{/each}}{{else}}No recent activities logged.{{/if}}

Based on all the provided information, what is the most appropriate next sales action for this lead, and what is your detailed reasoning?
`,
});

// Define the Genkit flow that orchestrates the prompt call
const suggestLeadNextActionFlow = ai.defineFlow(
  {
    name: 'suggestLeadNextActionFlow',
    inputSchema: SuggestLeadNextActionInputSchema,
    outputSchema: SuggestLeadNextActionOutputSchema,
  },
  async (input) => {
    // The prompt is designed to take the input directly.
    // Dates within the input object (Lead and Activity schemas) are expected to be Date objects.
    // Handlebars will stringify Date objects naturally.
    const { output } = await suggestLeadNextActionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a suggested next action.');
    }
    return output;
  }
);

// Export a wrapper function to easily call the flow from Next.js server actions or API routes
export async function suggestLeadNextAction(input: SuggestLeadNextActionInput): Promise<SuggestLeadNextActionOutput> {
  return suggestLeadNextActionFlow(input);
}
