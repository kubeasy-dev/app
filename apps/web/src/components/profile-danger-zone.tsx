import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export function ProfileDangerZone() {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => api.user.resetProgress(),
    onSuccess: (data) => {
      toast.success("Progress reset successfully", {
        description: `Deleted ${data.deletedChallenges} challenges and ${data.deletedXp} XP`,
      });
      setResetDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to reset progress", { description: error.message });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.deleteUser();
      if (error) throw error;
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error("Failed to delete account", { description: error.message });
    },
  });

  return (
    <div className="bg-red-50 neo-border border-red-600 neo-shadow shadow-red-600 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-600 p-2 neo-border border-red-800">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-red-700">Danger Zone</h2>
          <p className="text-sm text-red-600 font-medium">
            Irreversible actions — proceed with caution
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Reset progress section */}
        <div className="flex items-center justify-between bg-white neo-border p-4">
          <div>
            <p className="font-bold">Reset All Progress</p>
            <p className="text-sm text-muted-foreground">
              Delete all your completed challenges, XP, and statistics. This
              cannot be undone.
            </p>
          </div>
          <Button
            className="bg-red-600 text-white hover:bg-red-700 ml-4 shrink-0"
            onClick={() => setResetDialogOpen(true)}
          >
            Reset All Progress
          </Button>
        </div>

        {/* Delete account section */}
        <div className="flex items-center justify-between bg-white neo-border p-4">
          <div>
            <p className="font-bold">Delete My Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action is irreversible.
            </p>
          </div>
          <Button
            className="bg-red-600 text-white hover:bg-red-700 ml-4 shrink-0"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete My Account
          </Button>
        </div>
      </div>

      {/* Reset progress confirmation dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Progress</DialogTitle>
            <DialogDescription>This will permanently delete:</DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>All completed challenges</li>
            <li>All earned XP and level progress</li>
            <li>All statistics and streaks</li>
          </ul>
          <p className="text-sm font-semibold text-red-600">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending
                ? "Resetting..."
                : "Yes, Reset Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete account confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Your Account</DialogTitle>
            <DialogDescription>
              Are you absolutely sure? This will permanently delete your account
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-red-600 font-semibold">
            Your account cannot be recovered after deletion.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending
                ? "Deleting..."
                : "Yes, Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
