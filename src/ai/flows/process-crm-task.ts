
'use server';
/**
 * @fileOverview A Genkit flow that parses natural language CRM tasks into structured data.
 *
 * - processCRMTask - A function that interprets a user command (e.g., "Add lead John from Acme").
 * - ProcessCRMTaskInput - The input type for the processCRMTask function.
 * - ProcessCRMTaskOutput - The return type for the processCRMTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessCRMTaskInputSchema = z.object({
  command: z.string().describe('The natural language command from the user.'),
});
export type ProcessCRMTaskInput = z.infer<typeof ProcessCRMTaskInputSchema>;

const ProcessCRMTaskOutputSchema = z.object({
  action: z.enum(['add_lead', 'log_activity', 'schedule_event', 'unknown']),
  data: z.record(z.any()).describe('The structured data extracted from the command.'),
  confirmationMessage: z.string().describe('A friendly confirmation of what the AI understood.'),
});
export type ProcessCRMTaskOutput = z.infer<typeof ProcessCRMTaskOutputSchema>;

export async function processCRMTask(input: ProcessCRMTaskInput): Promise<ProcessCRMTaskOutput> {
  return processCRMTaskFlow(input);
}

const processCRMTaskPrompt = ai.definePrompt({
  name: 'processCRMTaskPrompt',
  input: {schema: ProcessCRMTaskInputSchema},
  output: {schema: ProcessCRMTaskOutputSchema},
  prompt: `You are a high-performance CRM assistant. Your job is to extract structured intent from user commands.

Possible actions:
1. add_lead: For adding new prospects. Data should include: name, company, email, dealValue, source.
2. log_activity: For recording calls/notes. Data should include: leadName, type (call/note), content.
3. schedule_event: For calendar items. Data should include: title, date, leadName.

If the command is unclear, set action to 'unknown'.

Command: {{{command}}}`,
});

const processCRMTaskFlow = ai.defineFlow(
  {
    name: 'processCRMTaskFlow',
    inputSchema: ProcessCRMTaskInputSchema,
    outputSchema: ProcessCRMTaskOutputSchema,
  },
  async (input) => {
    const {output} = await processCRMTaskPrompt(input);
    return output!;
  }
);
