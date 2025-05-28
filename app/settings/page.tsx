
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
import { Loader2, Save, SettingsIcon as SettingsPageIcon, BellRing, Info } from 'lucide-react'; 
import { Separator } from '@/components/ui/separator';
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const settingsSchema = z.object({
  defaultTaskTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid time format. Please use HH:MM (e.g., 09:30 or 17:00).",
  }),
  // enableEmailAlerts is handled separately, not part of this form schema directly
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
      // No need to reset enableEmailAlerts here, as it's managed directly by the Switch
    }
  }, [settings, isLoadingSettings, form]);

  const onSubmitTaskPreferences = (data: SettingsFormValues) => {
    setIsSaving(true);
    updateSettings({ defaultTaskTime: data.defaultTaskTime });
    toast({
      title: "Task Preferences Saved",
      description: "Your task preferences have been updated locally.",
    });
    setIsSaving(false);
  };

  const handleEmailAlertsToggle = (checked: boolean) => {
    updateSettings({ enableEmailAlerts: checked });
    toast({
      title: "Notification Settings Updated",
      description: `Email alerts ${checked ? 'enabled' : 'disabled'}. Actual email sending requires backend setup.`,
    });
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
          <form onSubmit={form.handleSubmit(onSubmitTaskPreferences)} className="space-y-6">
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
          <CardTitle className="flex items-center">
            <BellRing className="mr-2 h-5 w-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Manage how you receive alerts for your tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg bg-background/50">
            <div className="space-y-0.5">
                <Label htmlFor="emailAlerts" className="text-base font-medium">Enable Email Alerts</Label>
                <p className="text-xs text-muted-foreground">
                    Receive email reminders for your tasks.
                </p>
            </div>
            <Switch
              id="emailAlerts"
              checked={settings.enableEmailAlerts}
              onCheckedChange={handleEmailAlertsToggle}
              disabled={isLoadingSettings}
              aria-label="Toggle email alerts"
            />
          </div>
          <Alert variant="default" className="border-primary/30">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="font-semibold">Backend Implementation Note</AlertTitle>
            <AlertDescription className="text-xs">
              Enabling this setting saves your preference. However, the actual sending of emails (1 hour before, on due time) requires further backend development, including moving tasks to a database (like Firestore) and setting up an email service with Cloud Functions. Tasks are currently stored only in your browser.
            </AlertDescription>
          </Alert>
           <p className="text-sm text-muted-foreground pt-2">
            More notification options (e.g., push notifications) are planned for future updates.
          </p>
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground pt-4">
            Stay tuned for more customization options!
        </CardFooter>
      </Card>
    </div>
  );
}
