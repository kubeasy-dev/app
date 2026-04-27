import { Button } from "@kubeasy/ui/button";
import { Input } from "@kubeasy/ui/input";
import { Label } from "@kubeasy/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Save, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface ProfileSettingsProps {
  initialFirstName: string;
  initialLastName: string;
}

export function ProfileSettings({
  initialFirstName,
  initialLastName,
}: ProfileSettingsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const updateNameMutation = useMutation({
    mutationFn: async () => {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { data, error } = await authClient.updateUser({
        name: fullName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Profile updated successfully!");

      // 1. Invalidate React Query
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // 2. Invalidate TanStack Router loaders (force refetch session)
      await router.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      });
    },
  });

  const handleSaveProfile = () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    updateNameMutation.mutate();
  };

  return (
    <div className="bg-secondary neo-border neo-shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary text-primary-foreground neo-border">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Profile Settings</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="firstName" className="font-bold mb-2 block">
            First Name
          </Label>
          <Input
            id="firstName"
            data-testid="first-name-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="neo-border bg-background font-bold"
          />
        </div>

        <div>
          <Label htmlFor="lastName" className="font-bold mb-2 block">
            Last Name
          </Label>
          <Input
            id="lastName"
            data-testid="last-name-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="neo-border bg-background font-bold"
          />
        </div>
      </div>

      <Button
        onClick={handleSaveProfile}
        data-testid="save-profile-button"
        disabled={updateNameMutation.isPending}
        className="bg-primary text-primary-foreground neo-border neo-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4 mr-2" />
        {updateNameMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
