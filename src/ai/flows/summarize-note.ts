'use server';
/**
 * @fileOverview A Genkit flow to summarize a sales note or script.
 *
 * - summarizeNote - A function that handles the summarization process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNoteInputSchema = z.object({
  title: z.string().describe('The title of the note.'),
  content: z.string().describe('The full content of the note to be summarized.'),
});
export type SummarizeNoteInput = z.infer<typeof SummarizeNoteInputSchema>;

const SummarizeNoteOutputSchema = z.string().describe('A concise, professional summary of the note.');
export type SummarizeNoteOutput = z.infer<typeof SummarizeNoteOutputSchema>;

export async function summarizeNote(input: SummarizeNoteInput): Promise<SummarizeNoteOutput> {
  return summarizeNoteFlow(input);
}

const summarizeNotePrompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: SummarizeNoteInputSchema},
  output: {schema: SummarizeNoteOutputSchema},
  prompt: `You are an expert sales strategist. Your task is to provide a concise, high-impact summary of the following sales note or script. 

The summary should highlight the core message, key value propositions, and any specific action items or objections handled.

Note Title: {{{title}}}
Note Content:
{{{content}}}

Provide a professional summary suitable for a quick review by a sales manager.`,
});

const summarizeNoteFlow = ai.defineFlow(
  {
    name: 'summarizeNoteFlow',
    inputSchema: SummarizeNoteInputSchema,
    outputSchema: SummarizeNoteOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeNotePrompt(input);
    return output!;
  }
);
