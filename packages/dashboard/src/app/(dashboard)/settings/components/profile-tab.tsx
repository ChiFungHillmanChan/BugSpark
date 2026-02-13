"use client";

import { SettingsProfileForm } from "./settings-profile-form";
import { SettingsPasswordForm } from "./settings-password-form";
import { SettingsGoogleSection } from "./settings-google-section";

export function ProfileTab() {
  return (
    <div className="max-w-2xl space-y-8">
      <SettingsProfileForm />
      <SettingsPasswordForm />
      <SettingsGoogleSection />
    </div>
  );
}
