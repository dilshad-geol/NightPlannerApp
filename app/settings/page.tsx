
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, Save, SettingsIcon as SettingsPageIcon } from 'lucide-react'; // Renamed to avoid conflict
import { Separator } from '@/components/ui/separator';

const settingsSchema = z.object({
  defaultTaskTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid time format. Please use HH:MM (e.g., 09:30 or 17:00).",
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, isLoadingSettings, updateSettings } = useUserSettings();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultTaskTime: settings.defaultTaskTime,
    },
  });

  useEffect(() => {
    if (!isLoadingSettings) {
      form.reset({ defaultTaskTime: settings.defaultTaskTime });
    }
  }, [settings, isLoadingSettings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    setIsSaving(true);
    updateSettings({ defaultTaskTime: data.defaultTaskTime });
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated locally in your browser.",
    });
    setIsSaving(false);
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3">
        <SettingsPageIcon className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            User Settings
            </h1>
            <p className="mt-1 text-lg text-muted-foreground">
            Customize your Night Planner experience.
            </p>
        </div>
      </div>
      

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Task Preferences</CardTitle>
          <CardDescription>Set default values for new tasks. These settings are stored locally in your browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultTaskTime" className="text-base">Default Task Time</Label>
              <Input
                id="defaultTaskTime"
                type="time"
                {...form.register("defaultTaskTime")}
                className="w-full md:w-1/2 p-2 border rounded-md focus:ring-accent focus:border-accent"
                disabled={isSaving || isLoadingSettings}
              />
              {form.formState.errors.defaultTaskTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.defaultTaskTime.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                New tasks will default to this time on their due date.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSaving || isLoadingSettings}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Task Preferences
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Separator />

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>(Future Feature)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configuration for task reminders and other notifications will be available here in an upcoming update.
          </p>
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground">
            Stay tuned for more customization options!
        </CardFooter>
      </Card>
    </div>
  );
}
