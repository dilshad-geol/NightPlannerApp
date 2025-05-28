
"use client";

import type { Task } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, CalendarCheck2, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { PriorityBadge } from './PriorityBadge';
import { cn } from '@/lib/utils';

interface ScheduleViewProps {
  tasks: Task[];
  displayDate: Date; // Date this schedule is for
}

export function ScheduleView({ tasks, displayDate }: ScheduleViewProps) {
  // tasks prop should already be filtered by the parent for the displayDate
  // and to exclude archived tasks.

  let titleText = `Schedule for ${format(displayDate, 'MMMM d, yyyy')}`;
  if (isToday(displayDate)) {
    titleText = `Today's Schedule (${format(displayDate, 'MMM d')})`;
  } else if (isTomorrow(displayDate)) {
    titleText = `Tomorrow's Schedule (${format(displayDate, 'MMM d')})`;
  }

  let emptyMessage = `No tasks scheduled for ${format(displayDate, 'MMMM d')}.`;
  if (isToday(displayDate)) {
    emptyMessage = "No tasks scheduled for today.";
  } else if (isTomorrow(displayDate)) {
    emptyMessage = "No tasks scheduled for tomorrow yet.";
  }


  if (!tasks.length) {
    return (
      <Card className="mt-0 md:mt-0 shadow-lg"> {/* Adjusted margin for flex layout */}
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-foreground/90">
             <CalendarCheck2 className="mr-2 h-6 w-6 text-primary" /> {titleText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  return (
    <Card className="mt-0 md:mt-0 shadow-lg"> {/* Adjusted margin for flex layout */}
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-foreground/90">
           <CalendarCheck2 className="mr-2 h-6 w-6 text-primary" /> {titleText}
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

    