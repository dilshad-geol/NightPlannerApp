
"use client";

import { useMemo, useEffect } from 'react';
import { useTaskManager } from '@/hooks/useTaskManager';
import { TaskList } from '@/components/tasks/TaskList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function SummaryPage() {
  const { 
    tasks: allNonArchivedTasks, // Renamed to reflect it's already filtered from the hook
    isLoading, 
    toggleTaskCompletion, 
    archiveTask, // Changed from deleteTask
    fetchAiTimelineSuggestion, 
    getTasksForToday 
  } = useTaskManager();
  const { toast } = useToast();

  // getTasksForToday already filters for non-archived tasks
  const todayTasks = useMemo(() => getTasksForToday(), [getTasksForToday]);

  useEffect(() => {
    if (!isLoading && todayTasks.length > 0) { // Check todayTasks directly
        toast({
          title: "Today's Summary",
          description: `You have ${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'} planned for today.`,
          variant: "default",
        });
    } else if (!isLoading && todayTasks.length === 0) {
        toast({
            title: "Today's Summary",
            description: "No tasks planned for today.",
            variant: "default",
        });
    }
  }, [isLoading, todayTasks, toast]); // Depend on todayTasks

  
  const completedTasks = useMemo(() => todayTasks.filter(task => task.isCompleted), [todayTasks]);
  const pendingTasks = useMemo(() => todayTasks.filter(task => !task.isCompleted), [todayTasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Daily Summary
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Review your completed and pending tasks for today.
        </p>
      </div>

      {todayTasks.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No tasks were scheduled for today.</p>
          </CardContent>
        </Card>
      )}

      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-foreground/90">
              <AlertCircle className="mr-2 h-6 w-6 text-yellow-400" /> Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={pendingTasks}
              onToggleComplete={toggleTaskCompletion}
              onArchive={archiveTask} // Changed from onDelete
              onGetAiSuggestion={fetchAiTimelineSuggestion}
              emptyStateMessage="All tasks for today are completed! 🎉"
            />
          </CardContent>
        </Card>
      )}

      {completedTasks.length > 0 && (
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-foreground/90">
              <CheckCircle2 className="mr-2 h-6 w-6 text-green-400" /> Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={completedTasks}
              onToggleComplete={toggleTaskCompletion}
              onArchive={archiveTask} // Changed from onDelete
              onGetAiSuggestion={fetchAiTimelineSuggestion}
              emptyStateMessage="No tasks completed today yet."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
