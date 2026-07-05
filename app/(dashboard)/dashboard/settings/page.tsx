import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AiSettingsForm, type AiDefaultsPreferences } from "@/features/settings/components/ai-settings-form";
import { ApiKeysSection } from "@/features/settings/components/api-keys-section";
import { NotificationsForm } from "@/features/settings/components/notifications-form";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ThemeToggle } from "@/features/settings/components/theme-toggle";
import {
  VoicePreferencesForm,
  type VoiceDefaultsPreferences,
} from "@/features/settings/components/voice-preferences-form";
import { getApiKeys, getProfile } from "@/features/settings/queries";
import type { NotificationsValues } from "@/features/settings/schemas";

export const metadata: Metadata = { title: "Settings — Voxinta" };

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

interface ProfilePreferences {
  aiDefaults?: AiDefaultsPreferences;
  notifications?: Partial<NotificationsValues>;
  voiceDefaults?: VoiceDefaultsPreferences;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, apiKeys] = await Promise.all([getProfile(), getApiKeys()]);
  const preferences = (profile?.preferences ?? {}) as ProfilePreferences;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile, theme, AI defaults, API keys, and notification preferences.
        </p>
      </div>

      <ProfileForm profile={profile} email={user?.email ?? ""} />
      <ThemeToggle />
      <AiSettingsForm initial={preferences.aiDefaults} />
      <ApiKeysSection existingKeys={apiKeys} />
      <NotificationsForm initial={preferences.notifications} />
      <VoicePreferencesForm initial={preferences.voiceDefaults} />
    </div>
  );
}
