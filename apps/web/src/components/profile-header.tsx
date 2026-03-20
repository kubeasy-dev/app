import { useSuspenseQuery } from "@tanstack/react-query";
import type { User } from "better-auth/db";
import { UserIcon } from "lucide-react";
import { userXpOptions } from "@/lib/query-options";

export function ProfileHeader({ user }: { user: User }) {
  const { data: rankData } = useSuspenseQuery(userXpOptions());

  return (
    <div className="bg-secondary neo-border neo-shadow p-8 mb-6">
      <div className="flex items-center gap-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-full bg-primary neo-border neo-shadow-sm overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center">
              <UserIcon className="w-16 h-16 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-accent text-white px-3 py-1 neo-border text-xs font-black">
            {rankData?.rank.toUpperCase() ?? "N/A"}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-4xl font-black mb-1">{user.name}</h1>
          <p className="text-lg text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
