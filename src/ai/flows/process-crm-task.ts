
'use server';
/**
 * @fileOverview A Genkit flow that parses natural language CRM tasks into structured data for managers.
 *
 * - processCRMTask - A function that interprets a user command (e.g., "Assign lead John to Sarah").
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessCRMTaskInputSchema = z.object({
  command: z.string().describe('The natural language command from the manager.'),
});
export type ProcessCRMTaskInput = z.infer<typeof ProcessCRMTaskInputSchema>;

const ProcessCRMTaskOutputSchema = z.object({
  action: z.enum(['add_lead', 'assign_lead', 'log_activity', 'schedule_event', 'unknown']),
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
  prompt: `You are a high-performance CRM management assistant. Your job is to extract structured manager intent from commands.

Possible actions:
1. add_lead: For adding new prospects. Data: name, company, repName.
2. assign_lead: For delegating leads. Data: leadName, repName.
3. log_activity: For recording team actions. Data: repName, type (call/note), content.
4. schedule_event: For team meetings. Data: title, date, attendees.

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
