
"use client";

import type { Task } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, CalendarCheck2, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PriorityBadge } from './PriorityBadge';
import { cn } from '@/lib/utils';

interface ScheduleViewProps {
  tasks: Task[]; // These tasks should already be filtered (non-archived)
  title?: string;
}

export function ScheduleView({ tasks, title = "Next Day's Schedule" }: ScheduleViewProps) {
  // tasks prop should already be filtered by the parent (e.g., PlannerPage via getTasksForTomorrow)
  // to exclude archived tasks.

  if (!tasks.length) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-foreground/90">
             <CalendarCheck2 className="mr-2 h-6 w-6 text-primary" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No tasks scheduled for tomorrow yet. Add some tasks to see your plan!</p>
        </CardContent>
      </Card>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-foreground/90">
           <CalendarCheck2 className="mr-2 h-6 w-6 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sortedTasks.map(task => {
            const dueDate = parseISO(task.dueDate);
            // Double check task is not archived, though it should be pre-filtered
            if (task.isArchived) return null; 
            
            return (
              <li key={task.id} className={cn("flex items-start justify-between p-3 rounded-md border", task.isCompleted ? "bg-card/60 opacity-70" : "bg-card/90 hover:bg-card/100")}>
                <div className="flex items-start gap-3">
                  {task.isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" /> : <Clock className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <p className={cn("font-medium", task.isCompleted && "line-through text-muted-foreground")}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(dueDate, 'p')} {/* Format as time, e.g., 9:00 AM */}
                    </p>
                    {task.suggestedTimeline && (
                       <p className="text-xs text-primary/70 mt-1">AI Suggests: {task.suggestedTimeline}</p>
                    )}
                  </div>
                </div>
                <PriorityBadge priority={task.priority} className="text-xs px-1.5 py-0.5" />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
