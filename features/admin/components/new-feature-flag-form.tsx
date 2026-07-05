"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createFeatureFlag } from "../actions";
import {
  createFeatureFlagSchema,
  type CreateFeatureFlagFormValues,
  type CreateFeatureFlagInput,
} from "../schemas";

export function NewFeatureFlagForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();

  const form = useForm<CreateFeatureFlagFormValues, unknown, CreateFeatureFlagInput>({
    resolver: zodResolver(createFeatureFlagSchema),
    defaultValues: { key: "", description: "", enabled: false },
  });

  async function onSubmit(values: CreateFeatureFlagInput) {
    setFormError(undefined);
    const result = await createFeatureFlag(values);
    if (!result.success) {
      setFormError(result.message);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof CreateFeatureFlagInput, { message });
      }
      return;
    }
    form.reset({ key: "", description: "", enabled: false });
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key</FormLabel>
                <FormControl>
                  <Input placeholder="new-voice-ui" {...field} />
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
                  <Input placeholder="What does this flag control?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Plus /> {form.formState.isSubmitting ? "Adding…" : "Add flag"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
