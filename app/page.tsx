
"use client";

import { useState, useMemo, useEffect } from 'react';
import { TaskForm, type TaskFormValues } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { ScheduleView } from '@/components/tasks/ScheduleView';
import { useTaskManager } from '@/hooks/useTaskManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, ListTodo, CalendarDays, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task, TaskPriority } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { parseISO } from 'date-fns';


export default function PlannerPage() {
  const { 
    tasks: allNonArchivedTasks, // Renamed to reflect it's already filtered
    isLoading,
    addTask, 
    updateTask,
    toggleTaskCompletion, 
    archiveTask, // Changed from deleteTask
    fetchAiTimelineSuggestion,
    getTasksForTomorrow 
  } = useTaskManager();
  const { toast } = useToast();
  
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // getTasksForTomorrow already filters for non-archived tasks
  const tasksForTomorrow = useMemo(() => getTasksForTomorrow(), [getTasksForTomorrow]);

  const filteredTasksForTomorrow = useMemo(() => {
    return tasksForTomorrow // Start with already filtered (for tomorrow and non-archived) tasks
      .filter(task => priorityFilter === 'all' || task.priority === priorityFilter)
      .filter(task => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'completed') return task.isCompleted;
        if (statusFilter === 'pending') return !task.isCompleted;
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [tasksForTomorrow, priorityFilter, statusFilter]);

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null); 
  };

  const handleEditTaskFormSubmit = (data: TaskFormValues) => {
    if (editingTask) {
      updateTask({
        ...editingTask,
        title: data.title,
        description: data.description || "",
        dueDate: data.dueDate.toISOString(),
        priority: data.priority,
      });
      toast({ title: "Task Updated", description: `"${data.title}" has been updated.` });
    }
    handleCloseEditModal();
  };

  const handleAddTaskFormSubmit = (data: TaskFormValues) => {
     addTask({
       title: data.title,
       description: data.description || "",
       dueDate: data.dueDate.toISOString(),
       priority: data.priority,
     });
     toast({ title: "Task Added", description: `"${data.title}" has been added for tomorrow.`});
  };


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

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
          Create a New Task for Tomorrow
        </h2>
        <TaskForm
          onSubmitSuccess={handleAddTaskFormSubmit}
          submitButtonText="Add Task to Plan"
        />
      </div>
      

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
            tasks={filteredTasksForTomorrow} // Use the fully filtered list for tomorrow
            onToggleComplete={toggleTaskCompletion}
            onArchive={archiveTask} // Changed from onDelete
            onGetAiSuggestion={fetchAiTimelineSuggestion}
            onEditTask={handleOpenEditModal}
            emptyStateMessage={tasksForTomorrow.length > 0 ? "No tasks match your current filters for tomorrow." : "No tasks planned for tomorrow yet. Add your first task!"}
          />
        </TabsContent>
        <TabsContent value="schedule">
          {/* ScheduleView should use tasksForTomorrow which is already filtered for non-archived */}
          <ScheduleView tasks={tasksForTomorrow} /> 
        </TabsContent>
      </Tabs>

      {editingTask && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCloseEditModal(); else setIsEditModalOpen(true); }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to your task details below.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmitSuccess={handleEditTaskFormSubmit}
              initialData={{
                id: editingTask.id,
                title: editingTask.title,
                description: editingTask.description,
                dueDate: parseISO(editingTask.dueDate), 
                priority: editingTask.priority,
              }}
              onCancel={handleCloseEditModal}
              submitButtonText="Update Task"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
