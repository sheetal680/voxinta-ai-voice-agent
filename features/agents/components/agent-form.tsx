"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Agent } from "@/types/database";

import { createAgent, updateAgent } from "../actions";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  LANGUAGE_OPTIONS,
  MAX_TOKENS_CEILING,
} from "../constants";
import { agentFormSchema, type AgentFormInput, type AgentFormValues } from "../schemas";
import { AvatarUpload } from "./avatar-upload";
import { VoiceSelect } from "./voice-select";

function defaultValuesFrom(agent?: Agent): AgentFormValues {
  return {
    name: agent?.name ?? "",
    description: agent?.description ?? "",
    avatarUrl: agent?.avatar_url ?? "",
    prompt: agent?.prompt ?? "",
    personality: agent?.personality ?? "",
    welcomeMessage: agent?.welcome_message ?? "",
    voice: agent?.voice ?? "",
    temperature: agent?.temperature ?? DEFAULT_TEMPERATURE,
    language: agent?.language ?? DEFAULT_LANGUAGE,
    maxTokens: agent?.max_tokens ?? DEFAULT_MAX_TOKENS,
  };
}

export function AgentForm({ agent }: { agent?: Agent }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();

  const form = useForm<AgentFormValues, unknown, AgentFormInput>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: defaultValuesFrom(agent),
  });
  // useWatch (not form.watch) so this stays compiler-memoizable — it just
  // feeds the avatar fallback's live initials as the name is typed.
  const nameValue = useWatch({ control: form.control, name: "name" });

  function applyFieldErrors(fieldErrors: Record<string, string> | undefined) {
    for (const [field, message] of Object.entries(fieldErrors ?? {})) {
      form.setError(field as keyof AgentFormValues, { message });
    }
  }

  async function onSubmit(values: AgentFormInput) {
    setFormError(undefined);

    try {
      if (agent) {
        const result = await updateAgent(agent.id, values);
        if (!result.success) {
          setFormError(result.message);
          applyFieldErrors(result.fieldErrors);
          return;
        }
        router.push(`/dashboard/agents/${agent.id}`);
      } else {
        const result = await createAgent(values);
        if (!result.success || !result.data) {
          setFormError(result.message);
          applyFieldErrors(result.fieldErrors);
          return;
        }
        router.push(`/dashboard/agents/${result.data.id}`);
      }
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar</FormLabel>
              <FormControl>
                <AvatarUpload
                  agentName={nameValue}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Support Bot" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What does this agent do?" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="You are a helpful assistant that…"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The system prompt that defines this agent&apos;s behavior.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personality</FormLabel>
              <FormControl>
                <Textarea placeholder="Friendly, concise, upbeat…" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="welcomeMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Welcome message</FormLabel>
              <FormControl>
                <Textarea placeholder="Hi! How can I help you today?" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  <Select value={field.value} onValueChange={field.onChange}>
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

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => {
              const temperature = field.value ?? DEFAULT_TEMPERATURE;
              return (
                <FormItem>
                  <FormLabel>Temperature ({temperature.toFixed(1)})</FormLabel>
                  <FormControl>
                    <Slider
                      value={[temperature]}
                      onValueChange={(next) => {
                        field.onChange(Array.isArray(next) ? next[0] : next);
                      }}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </FormControl>
                  <FormDescription>Higher values make responses more random.</FormDescription>
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
                <FormLabel>Max tokens</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_TOKENS_CEILING}
                    value={field.value ?? DEFAULT_MAX_TOKENS}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? agent
                ? "Saving…"
                : "Creating…"
              : agent
                ? "Save changes"
                : "Create agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
