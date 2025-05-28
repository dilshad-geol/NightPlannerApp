
"use client";

import { useState, useMemo, useEffect } from 'react';
import { TaskForm, type TaskFormValues } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { ScheduleView } from '@/components/tasks/ScheduleView';
import { useTaskManager } from '@/hooks/useTaskManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, ListTodo, CalendarDays, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
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
import type { Task, TaskPriority, Recurrence } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { parseISO, format } from 'date-fns';

// Helper to map form values to Task's recurrence structure
const mapFormValuesToRecurrence = (formValues: TaskFormValues): Recurrence | undefined => {
  if (formValues.recurrenceType === 'none') {
    return undefined;
  }
  return { type: formValues.recurrenceType };
};


export default function PlannerPage() {
  const { 
    isLoading,
    addTask, 
    updateTask,
    toggleTaskCompletion, 
    archiveTask,
    fetchAiTimelineSuggestion,
    getTasksForTomorrow,
    getTasksForDate,
    getTaskById, // Added to fetch original task for editing
  } = useTaskManager();
  const { toast } = useToast();
  
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [activeTab, setActiveTab] = useState<string>("tasks"); 

  const [editingTask, setEditingTask] = useState<Task | null>(null); // This will hold the task template for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(new Date()); 

  const tasksForTomorrow = useMemo(() => getTasksForTomorrow(), [getTasksForTomorrow]);

  const filteredTasksForTomorrow = useMemo(() => {
    return tasksForTomorrow // These are already instances or non-recurring
      .filter(task => priorityFilter === 'all' || task.priority === priorityFilter)
      .filter(task => {
        if (statusFilter === 'all') return true;
        // For recurring instances, task.isCompleted is the instance completion status
        if (statusFilter === 'completed') return task.isCompleted; 
        if (statusFilter === 'pending') return !task.isCompleted;
        return true;
      })
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [tasksForTomorrow, priorityFilter, statusFilter]);

  const tasksForCalendarDate = useMemo(() => {
    return getTasksForDate(calendarSelectedDate);
  }, [getTasksForDate, calendarSelectedDate]);


  const handleOpenEditModal = (taskToEdit: Task) => {
    // If it's an instance, we want to edit the original task template.
    const originalTask = taskToEdit.originalTaskId ? getTaskById(taskToEdit.originalTaskId) : taskToEdit;
    if (originalTask) {
      setEditingTask(originalTask);
      setIsEditModalOpen(true);
    } else if (taskToEdit.originalTaskId) {
        toast({ title: "Error", description: "Could not find the original task to edit.", variant: "destructive" });
    } else {
        setEditingTask(taskToEdit); // It's already a template or non-recurring
        setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null); 
  };

  const handleEditTaskFormSubmit = (data: TaskFormValues) => {
    if (editingTask) {
      const recurrence = mapFormValuesToRecurrence(data);
      updateTask({
        ...editingTask, // Spread the original editingTask to keep its ID, createdAt, completedOccurrences etc.
        title: data.title,
        description: data.description || "",
        dueDate: data.dueDate.toISOString(), // This becomes the new start date for recurrence
        priority: data.priority,
        recurrence: recurrence || {type: 'none'}, // Update recurrence
      });
      toast({ title: "Task Updated", description: `"${data.title}" has been updated.` });
    }
    handleCloseEditModal();
  };

  const handleAddTaskFormSubmit = (data: TaskFormValues) => {
     // addTask in useTaskManager now expects TaskFormValues
     addTask(data);
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
      

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="tasks"><ListTodo className="mr-2 h-4 w-4" />Tasks for Tomorrow</TabsTrigger>
            <TabsTrigger value="day-schedule"><CalendarDays className="mr-2 h-4 w-4" />Day Schedule</TabsTrigger>
          </TabsList>
          
          {activeTab === 'tasks' && (
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
          )}
        </div>

        <TabsContent value="tasks">
          <TaskList
            tasks={filteredTasksForTomorrow}
            onToggleComplete={toggleTaskCompletion}
            onArchive={archiveTask}
            onGetAiSuggestion={fetchAiTimelineSuggestion}
            onEditTask={handleOpenEditModal}
            emptyStateMessage={tasksForTomorrow.length > 0 ? "No tasks match your current filters for tomorrow." : "No tasks planned for tomorrow yet. Add your first task!"}
          />
        </TabsContent>
        <TabsContent value="day-schedule">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-auto mx-auto md:mx-0">
              <Calendar
                mode="single"
                selected={calendarSelectedDate}
                onSelect={(date) => setCalendarSelectedDate(date || new Date())} 
                className="rounded-md border bg-card shadow-sm"
              />
            </div>
            <div className="flex-1 w-full">
              <ScheduleView 
                tasks={tasksForCalendarDate} 
                displayDate={calendarSelectedDate} 
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {editingTask && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCloseEditModal(); else setIsEditModalOpen(true); }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to your task details below. This will update the task template and all its future recurrences.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmitSuccess={handleEditTaskFormSubmit}
              initialData={{ // Map editingTask (Task) to TaskForm's initialData structure
                id: editingTask.id,
                title: editingTask.title,
                description: editingTask.description,
                dueDate: parseISO(editingTask.dueDate), 
                priority: editingTask.priority,
                recurrence: editingTask.recurrence, // Pass the recurrence object
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
