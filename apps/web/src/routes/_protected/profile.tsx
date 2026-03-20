import { createFileRoute } from "@tanstack/react-router";
import { ProfileApiTokens } from "@/components/profile-api-tokens";
import { ProfileDangerZone } from "@/components/profile-danger-zone";
import { ProfileEmailPreferences } from "@/components/profile-email-preferences";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileSettings } from "@/components/profile-settings";
import { userXpOptions } from "@/lib/query-options";

export const Route = createFileRoute("/_protected/profile")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(userXpOptions());
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();

  const [firstName, lastName] = user.name?.split(" ") ?? ["", ""];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <ProfileHeader user={user} />

        <div className="grid gap-6">
          <ProfileSettings
            initialFirstName={firstName ?? ""}
            initialLastName={lastName ?? ""}
          />

          <ProfileApiTokens />

          <ProfileEmailPreferences />

          <ProfileDangerZone />
        </div>
      </div>
    </div>
  );
}
