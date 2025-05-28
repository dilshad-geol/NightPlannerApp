
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string for date, can include time
  priority: TaskPriority;
  isCompleted: boolean;
  suggestedTimeline?: string;
  estimatedDuration?: string; // New field for AI suggested duration
  reasoning?: string;
  createdAt: string; // ISO string
  isArchived?: boolean; // New field for archiving
}
