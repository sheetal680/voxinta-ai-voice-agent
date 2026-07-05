"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // The server has no idea which theme localStorage holds, so the first
  // client render must match the server's markup exactly — rendering the
  // real selection only after mount (rather than reading `theme` right
  // away) is next-themes' documented way to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this genuinely can only be known post-hydration, not derived from props/state during render (next-themes' documented mount-guard idiom)
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose how Voxinta looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "gap-1.5 px-3",
                mounted && theme === option.value && "bg-card shadow-xs",
              )}
              onClick={() => setTheme(option.value)}
            >
              <option.icon className="size-3.5" />
              {option.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
