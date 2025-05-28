// src/ai/flows/suggest-timeline.ts
'use server';
/**
 * @fileOverview AI flow that suggests realistic timelines for tasks based on descriptions and user history.
 *
 * - suggestTimeline - A function that suggests a timeline for a given task.
 * - SuggestTimelineInput - The input type for the suggestTimeline function.
 * - SuggestTimelineOutput - The return type for the suggestTimeline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimelineInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task.'),
  userHistory: z.string().describe('The historical data of the user, including past tasks and their actual completion times.'),
});
export type SuggestTimelineInput = z.infer<typeof SuggestTimelineInputSchema>;

const SuggestTimelineOutputSchema = z.object({
  suggestedTimeline: z.string().describe('The suggested timeline for the task, including start and end times.'),
  reasoning: z.string().describe('The reasoning behind the suggested timeline.'),
});
export type SuggestTimelineOutput = z.infer<typeof SuggestTimelineOutputSchema>;

export async function suggestTimeline(input: SuggestTimelineInput): Promise<SuggestTimelineOutput> {
  return suggestTimelineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimelinePrompt',
  input: {schema: SuggestTimelineInputSchema},
  output: {schema: SuggestTimelineOutputSchema},
  prompt: `You are a personal planning assistant that suggests realistic timelines for tasks.

  Based on the task description and the user's historical data, suggest a timeline for the task, including start and end times.
  Explain your reasoning behind the suggested timeline.

  Task Description: {{{taskDescription}}}
  User History: {{{userHistory}}}

  Respond in a structured JSON format:
  {
    "suggestedTimeline": "Suggested timeline here",
    "reasoning": "Reasoning behind the suggestion"
  }`,
});

const suggestTimelineFlow = ai.defineFlow(
  {
    name: 'suggestTimelineFlow',
    inputSchema: SuggestTimelineInputSchema,
    outputSchema: SuggestTimelineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
