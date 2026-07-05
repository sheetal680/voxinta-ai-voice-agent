"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "@/features/agents/constants";
import { VoiceSelect } from "@/features/agents/components/voice-select";
import { updateVoicePreferences } from "../actions";
import { DEFAULT_VOICE_LANGUAGE } from "../constants";
import {
  voicePreferencesSchema,
  type VoicePreferencesFormValues,
  type VoicePreferencesInput,
} from "../schemas";

export interface VoiceDefaultsPreferences {
  voice?: string;
  language?: string;
}

export function VoicePreferencesForm({ initial }: { initial: VoiceDefaultsPreferences | undefined }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const form = useForm<VoicePreferencesFormValues, unknown, VoicePreferencesInput>({
    resolver: zodResolver(voicePreferencesSchema),
    defaultValues: {
      voice: initial?.voice ?? "",
      language: initial?.language ?? DEFAULT_VOICE_LANGUAGE,
    },
  });

  async function onSubmit(values: VoicePreferencesInput) {
    setFormError(undefined);
    setSuccessMessage(undefined);

    const result = await updateVoicePreferences(values);
    if (!result.success) {
      setFormError(result.message);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof VoicePreferencesInput, { message });
      }
      return;
    }
    setSuccessMessage(result.message ?? "Voice preferences updated.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice preferences</CardTitle>
        <CardDescription>Default voice and language for new agents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice</FormLabel>
                    <FormControl>
                      <VoiceSelect value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Select
                        items={Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.label]))}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save voice preferences"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
