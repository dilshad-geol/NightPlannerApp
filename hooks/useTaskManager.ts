
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
        setTasks(JSON.parse(storedTasks).map((task: Task) => ({ ...task, isArchived: task.isArchived || false })) );
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
      } catch (error) {
        console.error("Failed to save tasks to localStorage:", error);
      }
    }
  }, [tasks, isLoading]);

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'suggestedTimeline' | 'reasoning' | 'estimatedDuration' | 'isArchived'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      isArchived: false,
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

  const archiveTask = useCallback((taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isArchived: true } : task
      )
    );
  }, []);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(task => task.id === taskId && !task.isArchived);
  }, [tasks]);

  const getTasksForDate = useCallback((date: Date) => {
    const targetDateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate.startsWith(targetDateString) && !task.isArchived);
  }, [tasks]);
  
  const getTasksForTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getTasksForDate(tomorrow);
  }, [getTasksForDate]);

  const getTasksForToday = useCallback(() => {
    const today = new Date();
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toDateString();
      return taskDate === today.toDateString() && !task.isArchived;
    });
  }, [tasks]);

  const fetchAiTimelineSuggestion = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let userHistory = "User is planning tasks. ";
    const activeTasks = tasks.filter(t => !t.isArchived);
    if (activeTasks.length > 0) {
      userHistory += `Current active tasks include: ${activeTasks.slice(0, 3).map(t => `${t.title} (Priority: ${t.priority})`).join(', ')}.`;
    } else {
      userHistory += "No prior active task data available for this session.";
    }
    
    const input: SuggestTimelineInput = {
      taskDescription: `${task.title}. Details: ${task.description}. Priority: ${task.priority}. Current due date: ${new Date(task.dueDate).toLocaleDateString()}`,
      userHistory: userHistory,
    };

    try {
      const result = await suggestTimeline(input);
      updateTask({ 
        ...task, 
        suggestedTimeline: result.suggestedTimeline, 
        estimatedDuration: result.estimatedDuration,
        reasoning: result.reasoning 
      });
    } catch (error) {
      console.error("Error fetching AI timeline suggestion:", error);
      updateTask({ ...task, suggestedTimeline: "Error fetching suggestion.", reasoning: "Could not connect to AI service.", estimatedDuration: undefined });
    }
  }, [tasks, updateTask]);


  return {
    tasks: tasks.filter(task => !task.isArchived), // Return only non-archived tasks for general consumption
    allTasks: tasks, // For archive page or internal use
    isLoading,
    addTask,
    updateTask,
    toggleTaskCompletion,
    archiveTask,
    getTaskById,
    getTasksForTomorrow,
    getTasksForToday,
    fetchAiTimelineSuggestion,
  };
}
