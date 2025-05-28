
"use client";

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PriorityBadge } from './PriorityBadge';
import { Edit3, Zap, ChevronDown, ChevronUp, Clock, ArchiveIcon, Repeat } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


interface TaskCardProps {
  task: Task; // Could be a template or an instance
  onToggleComplete: (taskId: string, instanceDateISO?: string) => void;
  onArchive: (taskId: string) => void;
  onGetAiSuggestion: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void; // Edit should operate on the template
}

export function TaskCard({ task, onToggleComplete, onArchive, onGetAiSuggestion, onEdit }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const dueDate = parseISO(task.dueDate); // For instances, this is the instance due date
  const createdAt = parseISO(task.createdAt); // This is from the template

  let dueDateLabel = "";
  if (isToday(dueDate)) {
    dueDateLabel = `Today, ${format(dueDate, 'p')}`;
  } else if (isTomorrow(dueDate)) {
    dueDateLabel = `Tomorrow, ${format(dueDate, 'p')}`;
  } else {
    dueDateLabel = format(dueDate, 'PP p');
  }

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    // AI suggestion should target the original task if this is an instance
    await onGetAiSuggestion(task.originalTaskId || task.id);
    setIsAiLoading(false);
  }

  const handleToggleComplete = () => {
    if (task.isRecurringInstance && task.instanceDate) {
      onToggleComplete(task.originalTaskId || task.id, task.instanceDate);
    } else {
      onToggleComplete(task.id);
    }
  };
  
  const handleEdit = () => {
    // Editing always targets the template.
    // If `task` is an instance, we need to fetch/pass the template for editing.
    // For now, we assume `onEdit` expects the original task structure.
    // The parent (PlannerPage) will need to fetch the original task if `task.originalTaskId` exists.
    // This simplified version passes the current task object; parent needs to handle it.
    onEdit(task);
  };


  const isDueSoon = isToday(dueDate) && dueDate.getTime() > new Date().getTime() && (dueDate.getTime() - new Date().getTime()) < (4 * 60 * 60 * 1000);

  return (
    <Card className={cn("w-full shadow-lg hover:shadow-xl transition-shadow duration-300", task.isCompleted && !task.isRecurringInstance ? 'opacity-60 bg-card/80' : 'bg-card', task.isCompleted && task.isRecurringInstance ? 'bg-card/90 opacity-80' : 'bg-card', isDueSoon ? 'border-accent ring-2 ring-accent/50' : '', task.isArchived ? 'hidden' : '')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={`complete-${task.id}${task.isRecurringInstance ? '_' + task.instanceDate : ''}`}
            checked={task.isCompleted} // This is correct for both instances and non-recurring
            onCheckedChange={handleToggleComplete}
            aria-label={task.isCompleted ? "Mark task as incomplete" : "Mark task as complete"}
          />
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
                <CardTitle className={cn("text-lg font-semibold", task.isCompleted && 'line-through text-muted-foreground')}>
                {task.title}
                </CardTitle>
                {task.recurrence?.type === 'daily' && !task.isRecurringInstance && <Repeat className="h-4 w-4 text-muted-foreground" title="Daily Recurring Task Template" />}
                {task.isRecurringInstance && <Repeat className="h-4 w-4 text-primary" title="Daily Recurring Instance" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               <Clock className="h-3 w-3" /> 
               <span>Due: {dueDateLabel}</span>
               {isDueSoon && <span className="text-accent font-semibold">(Due Soon!)</span>}
            </div>
          </div>
        </div>
        <PriorityBadge priority={task.priority} />
      </CardHeader>
      
      {(task.description || task.suggestedTimeline || isExpanded) && (
        <CardContent className="pt-0">
          <Separator className="my-3" />
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 break-words">
              {isExpanded || (!task.description || task.description.length <= 100) || !task.suggestedTimeline ? task.description : `${task.description.substring(0,100)}${task.description.length > 100 ? '...' : ''}`}
            </p>
          )}

          {isAiLoading && (
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {!isAiLoading && task.suggestedTimeline && (
            <Alert variant="default" className="mb-3 bg-background/50 border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary/90">AI Suggestion (for template)</AlertTitle>
              <AlertDescription className="text-sm">
                <strong>Timeline:</strong> {task.suggestedTimeline}
                {task.estimatedDuration && <><br/><strong>Est. Duration:</strong> {task.estimatedDuration}</>}
                {task.reasoning && isExpanded && <><br/><strong>Reasoning:</strong> {task.reasoning}</>}
              </AlertDescription>
            </Alert>
          )}
          
          {( (task.description && task.description.length > 100) || task.suggestedTimeline || (task.reasoning && !isExpanded) ) && (
            <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 h-auto text-accent">
              {isExpanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
              {isExpanded ? 'Show Less' : 'Show Details'}
            </Button>
          )}
        </CardContent>
      )}
      
      <CardFooter className="flex justify-between items-center pt-4">
        <div className="text-xs text-muted-foreground">
          Added {formatDistanceToNow(createdAt, { addSuffix: true })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isAiLoading || task.isRecurringInstance} className="hover:border-accent hover:text-accent" title={task.isRecurringInstance ? "AI Plan targets the main task template" : "Get AI Plan"}>
            <Zap className="mr-1 h-4 w-4" /> AI Plan
          </Button>
          <Button variant="outline" size="icon" className="hover:border-primary hover:text-primary" onClick={handleEdit} aria-label="Edit task template">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="hover:border-destructive hover:text-destructive" onClick={() => onArchive(task.originalTaskId || task.id)} aria-label="Archive task template">
            <ArchiveIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

