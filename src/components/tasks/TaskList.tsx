"use client";

import type { Task } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { AnimatePresence, motion } from 'framer-motion'; // For animations

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onGetAiSuggestion: (taskId: string) => Promise<void>;
  title?: string;
  emptyStateMessage?: string;
}

export function TaskList({ tasks, onToggleComplete, onDelete, onGetAiSuggestion, title, emptyStateMessage = "No tasks here yet. Time to plan!" }: TaskListProps) {
  if (!tasks.length) {
    return (
      <div className="text-center py-10">
        {title && <h3 className="text-xl font-semibold mb-4 text-foreground/80">{title}</h3>}
        <p className="text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-xl font-semibold mb-4 text-foreground/80">{title}</h3>}
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout // Animates layout changes (e.g., when items are added/removed)
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <TaskCard
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onGetAiSuggestion={onGetAiSuggestion}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
