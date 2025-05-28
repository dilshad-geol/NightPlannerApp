
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskPriority, Recurrence } from '@/lib/types';
import { suggestTimeline, type SuggestTimelineInput } from '@/ai/flows/suggest-timeline';
import { parseISO, format, isSameDay, isBefore, startOfDay, setHours, setMinutes } from 'date-fns';
import type { TaskFormValues } from '@/components/tasks/TaskForm'; // Import TaskFormValues

const LOCAL_STORAGE_KEY = 'nightPlannerTasks';

// Helper to map form values to Task's recurrence structure
const mapFormValuesToRecurrence = (formValues: TaskFormValues): Recurrence | undefined => {
  if (formValues.recurrenceType === 'none') {
    return undefined;
  }
  return { type: formValues.recurrenceType };
};

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks).map((task: Task) => ({ 
          ...task, 
          isArchived: task.isArchived || false,
          recurrence: task.recurrence || { type: 'none' }, // Ensure recurrence exists
          completedOccurrences: task.completedOccurrences || {} 
        })) );
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { 
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error)
      {
        console.error("Failed to save tasks to localStorage:", error);
      }
    }
  }, [tasks, isLoading]);

  const addTask = useCallback((taskFormValues: TaskFormValues) => {
    const recurrence = mapFormValuesToRecurrence(taskFormValues);
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskFormValues.title,
      description: taskFormValues.description || "",
      dueDate: taskFormValues.dueDate.toISOString(),
      priority: taskFormValues.priority,
      isCompleted: false, // Default for new task template
      createdAt: new Date().toISOString(),
      isArchived: false,
      recurrence: recurrence || { type: 'none'}, // ensure recurrence is set
      completedOccurrences: {},
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  }, []);

  const updateTask = useCallback((updatedTaskData: Task & { recurrenceType?: 'none' | 'daily' }) => {
    // If recurrenceType is part of updatedTaskData (from form), map it
    let recurrenceToSave = updatedTaskData.recurrence;
    if (updatedTaskData.recurrenceType) {
        recurrenceToSave = { type: updatedTaskData.recurrenceType };
    }

    const taskWithMappedRecurrence = {
        ...updatedTaskData,
        recurrence: recurrenceToSave || { type: 'none' },
    };
    // Remove recurrenceType if it was just for mapping
    delete (taskWithMappedRecurrence as any).recurrenceType;


    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === taskWithMappedRecurrence.id ? taskWithMappedRecurrence : task))
    );
  }, []);


  const toggleTaskCompletion = useCallback((taskId: string, instanceDateISO?: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          if (task.recurrence?.type === 'daily' && instanceDateISO) {
            const dateStr = format(parseISO(instanceDateISO), 'yyyy-MM-dd');
            const newCompletedOccurrences = { ...task.completedOccurrences };
            newCompletedOccurrences[dateStr] = !newCompletedOccurrences[dateStr];
            return { ...task, completedOccurrences: newCompletedOccurrences };
          } else {
            // Non-recurring task or template itself (though template completion might not be used much)
            return { ...task, isCompleted: !task.isCompleted };
          }
        }
        return task;
      })
    );
  }, []);

  const archiveTask = useCallback((taskId: string) => {
    // For recurring tasks, archiving the template archives all instances.
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isArchived: true } : task
      )
    );
  }, []);

  const getTaskById = useCallback((taskId: string) => {
    // This might need adjustment if we want to get a specific instance by a unique ID
    // For now, it returns the template for a recurring task.
    return tasks.find(task => task.id === taskId && !task.isArchived);
  }, [tasks]);

  const getTasksForDate = useCallback((date: Date): Task[] => {
    const targetDateStartOfDay = startOfDay(date);
    const generatedTasks: Task[] = [];

    tasks.forEach(task => {
      if (task.isArchived) return;

      const taskOriginalDueDate = parseISO(task.dueDate);

      if (task.recurrence?.type === 'daily') {
        // If original due date is on or before the target date, it's a candidate
        if (isBefore(taskOriginalDueDate, targetDateStartOfDay) || isSameDay(taskOriginalDueDate, targetDateStartOfDay)) {
          const instanceDateStr = format(targetDateStartOfDay, 'yyyy-MM-dd');
          const isInstanceCompleted = task.completedOccurrences?.[instanceDateStr] || false;
          
          // Create the instance dueDate with the original time
          const instanceDueDate = setMinutes(setHours(targetDateStartOfDay, taskOriginalDueDate.getHours()), taskOriginalDueDate.getMinutes());

          generatedTasks.push({
            ...task,
            // id: `${task.id}_${instanceDateStr}`, // Consider for truly unique keys if needed elsewhere
            dueDate: instanceDueDate.toISOString(),
            isCompleted: isInstanceCompleted,
            isRecurringInstance: true,
            instanceDate: targetDateStartOfDay.toISOString(), // Date part of the instance
            originalTaskId: task.id,
          });
        }
      } else {
        // Non-recurring task
        if (isSameDay(taskOriginalDueDate, targetDateStartOfDay)) {
          generatedTasks.push({
            ...task,
            isRecurringInstance: false, // Explicitly mark
          });
        }
      }
    });
    return generatedTasks;
  }, [tasks]);
  
  const getTasksForTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getTasksForDate(tomorrow);
  }, [getTasksForDate]);

  const getTasksForToday = useCallback(() => {
    return getTasksForDate(new Date());
  }, [getTasksForDate]);

  const fetchAiTimelineSuggestion = useCallback(async (taskId: string) => {
    // AI suggestion should ideally work on the task template.
    // If an instance ID is passed (e.g. from a card representing an instance),
    // we might need to retrieve the original task. For now, assume taskId is for the template.
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let userHistory = "User is planning tasks. ";
    const activeTasks = tasks.filter(t => !t.isArchived); // Consider only templates or a mix?
    if (activeTasks.length > 0) {
      userHistory += `Current active tasks include: ${activeTasks.slice(0, 3).map(t => `${t.title} (Priority: ${t.priority})`).join(', ')}.`;
    } else {
      userHistory += "No prior active task data available for this session.";
    }
    
    const input: SuggestTimelineInput = {
      taskDescription: `${task.title}. Details: ${task.description}. Priority: ${task.priority}. Original due date: ${new Date(task.dueDate).toLocaleDateString()}`,
      userHistory: userHistory,
    };

    try {
      const result = await suggestTimeline(input);
      // Update the template task with AI suggestions
      const updatedTask = { 
        ...task, 
        suggestedTimeline: result.suggestedTimeline, 
        estimatedDuration: result.estimatedDuration,
        reasoning: result.reasoning 
      };
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));

    } catch (error) {
      console.error("Error fetching AI timeline suggestion:", error);
       const errorTask = { ...task, suggestedTimeline: "Error fetching suggestion.", reasoning: "Could not connect to AI service.", estimatedDuration: undefined };
       setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? errorTask : t));
    }
  }, [tasks]);


  return {
    tasks: tasks.filter(task => !task.isArchived), // This now means non-archived templates
    allTasks: tasks, 
    isLoading,
    addTask,
    updateTask,
    toggleTaskCompletion,
    archiveTask,
    getTaskById, // Returns template
    getTasksForTomorrow, // Returns instances
    getTasksForToday, // Returns instances
    getTasksForDate, // Returns instances
    fetchAiTimelineSuggestion,
  };
}

