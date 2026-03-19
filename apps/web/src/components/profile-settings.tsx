import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";

interface ProfileSettingsProps {
  initialFirstName: string;
  initialLastName: string;
}

export function ProfileSettings({
  initialFirstName,
  initialLastName,
}: ProfileSettingsProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.user.updateName(firstName.trim(), lastName.trim() || undefined),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      });
    },
  });

  function handleSaveProfile() {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    mutate();
  }

  return (
    <div className="bg-secondary neo-border neo-shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary p-2 neo-border">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-black">Profile Settings</h2>
          <p className="text-sm text-muted-foreground font-medium">
            Update your personal information
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="font-bold">
            First Name
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="font-bold">
            Last Name
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
