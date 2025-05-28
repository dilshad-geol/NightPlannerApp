
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { TaskPriority } from "@/lib/types";
import { useEffect, useCallback } from "react";
import { useUserSettings } from '@/hooks/useUserSettings'; // Import useUserSettings

const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100),
  description: z.string().max(500).optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
  priority: z.enum(['low', 'medium', 'high'] as [TaskPriority, ...TaskPriority[]], {
    required_error: "Priority is required.",
  }),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmitSuccess: (data: TaskFormValues) => void;
  initialData?: Partial<TaskFormValues & { id?: string }>;
  onCancel?: () => void;
  submitButtonText?: string;
}

export function TaskForm({ onSubmitSuccess, initialData, onCancel, submitButtonText }: TaskFormProps) {
  const { settings: userSettings, isLoadingSettings } = useUserSettings();

  const getDefaultDueDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!isLoadingSettings && userSettings.defaultTaskTime) {
      const [hours, minutes] = userSettings.defaultTaskTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        tomorrow.setHours(hours, minutes, 0, 0);
      } else {
        tomorrow.setHours(9, 0, 0, 0); // Fallback if time parsing fails
      }
    } else {
      tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM if no settings or still loading
    }
    return tomorrow;
  }, [userSettings, isLoadingSettings]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      dueDate: initialData?.dueDate ? (typeof initialData.dueDate === 'string' ? parseISO(initialData.dueDate) : initialData.dueDate) : getDefaultDueDate(),
      priority: initialData?.priority || "medium",
    },
  });

  useEffect(() => {
    if (!isLoadingSettings) { // Only reset based on settings once they are loaded
      if (initialData) {
        form.reset({
          title: initialData.title || "",
          description: initialData.description || "",
          dueDate: initialData.dueDate ? (typeof initialData.dueDate === 'string' ? parseISO(initialData.dueDate) : initialData.dueDate) : getDefaultDueDate(),
          priority: initialData.priority || "medium",
        });
      } else {
        form.reset({ title: "", description: "", dueDate: getDefaultDueDate(), priority: "medium" });
      }
    }
  }, [initialData, form, getDefaultDueDate, isLoadingSettings]); // Add isLoadingSettings to dependency array

  function processSubmit(data: TaskFormValues) {
    onSubmitSuccess(data);
    if (!initialData && !isLoadingSettings) { // Only auto-reset for new task form, once settings are loaded
      form.reset({ title: "", description: "", dueDate: getDefaultDueDate(), priority: "medium" });
    }
  }

  const effectiveSubmitButtonText = submitButtonText || (initialData ? 'Update Task' : 'Add Task');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Prepare presentation" {...field} disabled={isLoadingSettings && !initialData} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add more details about the task..." className="resize-none" {...field} disabled={isLoadingSettings && !initialData} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date {initialData ? '' : 'for Next Day'}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoadingSettings && !initialData}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                           const newDate = new Date(date);
                           const referenceTimeSource = field.value || getDefaultDueDate();
                           newDate.setHours(referenceTimeSource.getHours(), referenceTimeSource.getMinutes(), 0, 0);
                           field.onChange(newDate);
                        }
                      }}
                      disabled={(date) => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() -1);
                        yesterday.setHours(0,0,0,0); // Compare date part only for past check
                        return initialData ? false : date < yesterday;
                      }}
                      initialFocus
                    />
                    <div className="p-2 border-t border-border">
                      <Input
                        type="time"
                        defaultValue={field.value ? format(field.value, "HH:mm") : format(getDefaultDueDate(), "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDate = field.value ? new Date(field.value) : new Date(getDefaultDueDate());
                          if (!isNaN(hours) && !isNaN(minutes)) {
                            newDate.setHours(hours, minutes);
                            field.onChange(newDate);
                          }
                        }}
                        className="w-full"
                        disabled={isLoadingSettings && !initialData}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingSettings && !initialData}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className={cn("flex gap-2", onCancel ? "justify-end" : "justify-start")}>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoadingSettings && !initialData}>
              Cancel
            </Button>
          )}
          <Button type="submit" className={cn(onCancel ? "" : "w-full md:w-auto", "bg-accent text-accent-foreground hover:bg-accent/90")} disabled={isLoadingSettings && !initialData}>
            {initialData ? <Save className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            {effectiveSubmitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
