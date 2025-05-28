"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskPriority } from '@/lib/types';
import { suggestTimeline, type SuggestTimelineInput } from '@/ai/flows/suggest-timeline';

const LOCAL_STORAGE_KEY = 'nightPlannerTasks';

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage:", error);
      // Optionally, clear corrupted storage
      // localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { // Only save after initial load is complete
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error("Failed to save tasks to localStorage:", error);
      }
    }
  }, [tasks, isLoading]);

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'suggestedTimeline' | 'reasoning'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  const getTasksForDate = useCallback((date: Date) => {
    const targetDateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate.startsWith(targetDateString));
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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Simple user history based on current tasks
    // For a more sophisticated history, you might analyze completed tasks, average completion times etc.
    let userHistory = "User is planning tasks. ";
    if (tasks.length > 0) {
      userHistory += `Current tasks include: ${tasks.slice(0, 3).map(t => `${t.title} (Priority: ${t.priority})`).join(', ')}.`;
    } else {
      userHistory += "No prior task data available for this session.";
    }
    
    const input: SuggestTimelineInput = {
      taskDescription: `${task.title}. Details: ${task.description}. Priority: ${task.priority}. Current due date: ${new Date(task.dueDate).toLocaleDateString()}`,
      userHistory: userHistory,
    };

    try {
      const result = await suggestTimeline(input);
      updateTask({ ...task, suggestedTimeline: result.suggestedTimeline, reasoning: result.reasoning });
    } catch (error) {
      console.error("Error fetching AI timeline suggestion:", error);
      updateTask({ ...task, suggestedTimeline: "Error fetching suggestion.", reasoning: "Could not connect to AI service." });
    }
  }, [tasks, updateTask]);


  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    getTaskById,
    getTasksForTomorrow,
    getTasksForToday,
    fetchAiTimelineSuggestion,
  };
}
