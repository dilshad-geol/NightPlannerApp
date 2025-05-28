
"use client";

import type { Task } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { AnimatePresence, motion } from 'framer-motion'; // For animations

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onArchive: (taskId: string) => void; // Changed onDelete to onArchive
  onGetAiSuggestion: (taskId: string) => Promise<void>;
  onEditTask?: (task: Task) => void; 
  title?: string;
  emptyStateMessage?: string;
}

export function TaskList({ tasks, onToggleComplete, onArchive, onGetAiSuggestion, onEditTask, title, emptyStateMessage = "No tasks here yet. Time to plan!" }: TaskListProps) {
  const activeTasks = tasks.filter(task => !task.isArchived);

  if (!activeTasks.length) {
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
        {activeTasks.map((task) => (
          <motion.div
            key={task.id}
            layout 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <TaskCard
              task={task}
              onToggleComplete={onToggleComplete}
              onArchive={onArchive} // Pass onArchive
              onGetAiSuggestion={onGetAiSuggestion}
              onEdit={onEditTask ? () => onEditTask(task) : () => console.warn("onEditTask not provided")}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
