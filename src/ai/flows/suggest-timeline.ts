// src/ai/flows/suggest-timeline.ts
'use server';
/**
 * @fileOverview AI flow that suggests realistic timelines and durations for tasks based on descriptions and user history.
 *
 * - suggestTimeline - A function that suggests a timeline and duration for a given task.
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
  estimatedDuration: z.string().describe('The estimated duration for the task (e.g., "30 minutes", "1 hour").'),
  reasoning: z.string().describe('The reasoning behind the suggested timeline and duration.'),
});
export type SuggestTimelineOutput = z.infer<typeof SuggestTimelineOutputSchema>;

export async function suggestTimeline(input: SuggestTimelineInput): Promise<SuggestTimelineOutput> {
  return suggestTimelineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimelinePrompt',
  input: {schema: SuggestTimelineInputSchema},
  output: {schema: SuggestTimelineOutputSchema},
  prompt: `You are a personal planning assistant that suggests realistic timelines and estimates durations for tasks.

  Based on the task description and the user's historical data:
  1. Suggest a timeline for the task, including start and end times.
  2. Estimate the duration required to complete the task (e.g., "45 minutes", "2 hours").
  3. Explain your reasoning behind the suggested timeline and duration.

  Task Description: {{{taskDescription}}}
  User History: {{{userHistory}}}

  Respond in a structured JSON format:
  {
    "suggestedTimeline": "Suggested timeline here (e.g., Tomorrow 9:00 AM - 10:30 AM)",
    "estimatedDuration": "Estimated duration here (e.g., 1 hour 30 minutes)",
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
