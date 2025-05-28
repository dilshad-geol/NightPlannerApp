
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Recurrence {
  type: 'none' | 'daily'; // Extend with 'weekly', 'monthly' later
  // For weekly: daysOfWeek?: number[]; (0 for Sunday, 1 for Monday, ...)
  // For monthly: dayOfMonth?: number;
  // endDate?: string; // Optional end date for recurrence
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string for date, for recurring tasks this is the start date/time
  priority: TaskPriority;
  isCompleted: boolean; // For non-recurring tasks or as a general flag for the template
  suggestedTimeline?: string;
  estimatedDuration?: string;
  reasoning?: string;
  createdAt: string; // ISO string
  isArchived?: boolean;
  recurrence?: Recurrence;
  completedOccurrences?: Record<string, boolean>; // e.g., { "2023-10-28": true, "2023-10-29": false }
  
  // Transient properties for UI, not stored directly but populated by useTaskManager
  isRecurringInstance?: boolean; // True if this task object is a generated instance
  instanceDate?: string; // ISO date string of the instance
  originalTaskId?: string; // ID of the parent recurring task
}
