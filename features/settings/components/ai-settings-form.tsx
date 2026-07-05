"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { updateAiSettings } from "../actions";
import { AI_PROVIDER_OPTIONS, DEFAULT_AI_MAX_TOKENS, DEFAULT_AI_PROVIDER, DEFAULT_AI_TEMPERATURE } from "../constants";
import { aiSettingsSchema, type AiSettingsFormValues, type AiSettingsInput } from "../schemas";

export interface AiDefaultsPreferences {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export function AiSettingsForm({ initial }: { initial: AiDefaultsPreferences | undefined }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const form = useForm<AiSettingsFormValues, unknown, AiSettingsInput>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      provider: (initial?.provider as AiSettingsFormValues["provider"]) ?? DEFAULT_AI_PROVIDER,
      model: initial?.model ?? "",
      temperature: initial?.temperature ?? DEFAULT_AI_TEMPERATURE,
      maxTokens: initial?.maxTokens ?? DEFAULT_AI_MAX_TOKENS,
    },
  });

  async function onSubmit(values: AiSettingsInput) {
    setFormError(undefined);
    setSuccessMessage(undefined);

    const result = await updateAiSettings(values);
    if (!result.success) {
      setFormError(result.message);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof AiSettingsInput, { message });
      }
      return;
    }
    setSuccessMessage(result.message ?? "AI settings updated.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI settings</CardTitle>
        <CardDescription>
          Default provider and model settings for new agents. Doesn&apos;t change agents you&apos;ve
          already configured.
        </CardDescription>
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
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default provider</FormLabel>
                    <FormControl>
                      <Select
                        items={Object.fromEntries(AI_PROVIDER_OPTIONS.map((o) => [o.value, o.label]))}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_PROVIDER_OPTIONS.map((option) => (
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

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default model</FormLabel>
                    <FormControl>
                      <Input placeholder="llama-3.3-70b-versatile" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank to use the provider&apos;s default.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => {
                  const temperature = field.value ?? DEFAULT_AI_TEMPERATURE;
                  return (
                    <FormItem>
                      <FormLabel>Default temperature ({temperature.toFixed(1)})</FormLabel>
                      <FormControl>
                        <Slider
                          value={[temperature]}
                          onValueChange={(next) => field.onChange(Array.isArray(next) ? next[0] : next)}
                          min={0}
                          max={2}
                          step={0.1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default max tokens</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? DEFAULT_AI_MAX_TOKENS}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save AI settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
