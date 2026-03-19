import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Key, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { trackApiTokenCopied, trackApiTokenCreated } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";

interface ApiKey {
  id: string;
  name: string;
  createdAt: Date | string;
}

export function ProfileApiTokens() {
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(
    null,
  );
  const [newlyCreatedTokenName, setNewlyCreatedTokenName] =
    useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<ApiKey | null>(null);

  const { data: tokens, refetch } = useSuspenseQuery({
    queryKey: ["apiKey.list"],
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list();
      if (error) throw error;
      const keys = data as unknown as {
        apiKeys: ApiKey[];
        total: number;
        limit?: number;
        offset?: number;
      } | null;
      return (keys?.apiKeys ?? []) as ApiKey[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await authClient.apiKey.create({ name });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.key) {
        setNewlyCreatedToken(data.key);
        setNewlyCreatedTokenName(newTokenName);
      }
      trackApiTokenCreated();
      setNewTokenName("");
      setShowNewTokenForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create token", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await authClient.apiKey.delete({ keyId });
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
      toast.success("Token deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete token", { description: error.message });
    },
  });

  function handleCopyToken(token: string, tokenName: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    trackApiTokenCopied(tokenName);
    toast.success("Token copied to clipboard");
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function handleCreateToken() {
    if (!newTokenName.trim()) {
      toast.error("Token name is required");
      return;
    }
    createMutation.mutate(newTokenName.trim());
  }

  function openDeleteDialog(token: ApiKey) {
    setTokenToDelete(token);
    setDeleteDialogOpen(true);
  }

  return (
    <div className="bg-secondary neo-border neo-shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 neo-border">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">API Tokens</h2>
            <p className="text-sm text-muted-foreground font-medium">
              Manage your CLI authentication tokens
            </p>
          </div>
        </div>
        <Button
          className="bg-accent text-white hover:bg-accent/90"
          onClick={() => setShowNewTokenForm(true)}
        >
          <Plus className="h-4 w-4" />
          New Token
        </Button>
      </div>

      {/* Newly created token alert */}
      {newlyCreatedToken && (
        <div className="mb-4 bg-green-50 neo-border border-green-600 p-4">
          <p className="text-sm font-bold text-green-800 mb-2">
            Your new token has been created. Copy it now — it won't be shown
            again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background neo-border px-3 py-2 text-sm font-mono break-all">
              {newlyCreatedToken}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                handleCopyToken(newlyCreatedToken, newlyCreatedTokenName)
              }
            >
              {copiedToken === newlyCreatedToken ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-green-700 hover:text-green-800"
            onClick={() => setNewlyCreatedToken(null)}
          >
            I've saved my token
          </Button>
        </div>
      )}

      {/* New token form */}
      {showNewTokenForm && (
        <div className="mb-4 bg-background neo-border p-4">
          <p className="text-sm font-bold mb-3">Create a new API token</p>
          <div className="flex items-center gap-2">
            <Input
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Token name (e.g. my-laptop)"
              onKeyDown={(e) => e.key === "Enter" && handleCreateToken()}
            />
            <Button
              onClick={handleCreateToken}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewTokenForm(false);
                setNewTokenName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Token list */}
      {tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Key className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-bold text-muted-foreground">No API tokens yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first token to authenticate with the CLI
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between bg-background neo-border px-4 py-3"
            >
              <div>
                <p className="font-bold text-sm">{token.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(token.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => openDeleteDialog(token)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{tokenToDelete?.name}</strong>? Any CLI sessions using
              this token will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() =>
                tokenToDelete && deleteMutation.mutate(tokenToDelete.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
