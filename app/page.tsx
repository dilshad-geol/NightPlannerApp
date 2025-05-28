"use client";

import { useState, useMemo, useEffect } from 'react';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { ScheduleView } from '@/components/tasks/ScheduleView';
import { useTaskManager } from '@/hooks/useTaskManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, ListTodo, CalendarDays, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskPriority } from '@/lib/types';

export default function PlannerPage() {
  const { 
    tasks, 
    isLoading,
    addTask, 
    toggleTaskCompletion, 
    deleteTask, 
    fetchAiTimelineSuggestion,
    getTasksForTomorrow 
  } = useTaskManager();
  
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const tasksForTomorrow = useMemo(() => getTasksForTomorrow(), [getTasksForTomorrow]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const isTomorrow = new Date(task.dueDate).toDateString() === new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
        return isTomorrow; // Only show tasks planned for tomorrow
      })
      .filter(task => priorityFilter === 'all' || task.priority === priorityFilter)
      .filter(task => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'completed') return task.isCompleted;
        if (statusFilter === 'pending') return !task.isCompleted;
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Sort by creation time
  }, [tasks, priorityFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading your plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Plan Your Next Day
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Set your tasks for tomorrow, get AI timeline suggestions, and conquer your day.
        </p>
      </div>

      <TaskForm onSubmit={addTask} />

      <Tabs defaultValue="tasks" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="tasks"><ListTodo className="mr-2 h-4 w-4" />Tasks for Tomorrow</TabsTrigger>
            <TabsTrigger value="schedule"><CalendarDays className="mr-2 h-4 w-4" />Schedule View</TabsTrigger>
          </TabsList>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter Tasks
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={priorityFilter === 'all'} onCheckedChange={() => setPriorityFilter('all')}>All</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={priorityFilter === 'high'} onCheckedChange={() => setPriorityFilter('high')}>High</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={priorityFilter === 'medium'} onCheckedChange={() => setPriorityFilter('medium')}>Medium</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={priorityFilter === 'low'} onCheckedChange={() => setPriorityFilter('low')}>Low</DropdownMenuCheckboxItem>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>All</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === 'pending'} onCheckedChange={() => setStatusFilter('pending')}>Pending</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === 'completed'} onCheckedChange={() => setStatusFilter('completed')}>Completed</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="tasks">
          <TaskList
            tasks={filteredTasks}
            onToggleComplete={toggleTaskCompletion}
            onDelete={deleteTask}
            onGetAiSuggestion={fetchAiTimelineSuggestion}
            emptyStateMessage={tasks.length > 0 ? "No tasks match your current filters for tomorrow." : "No tasks planned for tomorrow yet. Add your first task!"}
          />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleView tasks={tasksForTomorrow} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
