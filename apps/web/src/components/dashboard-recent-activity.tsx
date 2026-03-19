import type { XpTransaction } from "@kubeasy/api-schemas/xp";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { xpTransactionsOptions } from "@/lib/query-options";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 4;

interface MonthGroup {
  key: string;
  label: string;
  items: XpTransaction[];
}

function groupByMonth(transactions: XpTransaction[]): MonthGroup[] {
  const groupMap = new Map<string, MonthGroup>();

  for (const tx of transactions) {
    const date = new Date(tx.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!groupMap.has(key)) {
      groupMap.set(key, { key, label, items: [] });
    }
    groupMap.get(key)?.items.push(tx);
  }

  return Array.from(groupMap.values()).sort((a, b) =>
    b.key.localeCompare(a.key),
  );
}

interface ActivityItemProps {
  activity: XpTransaction;
  compact?: boolean;
}

function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  const dateStr = new Date(activity.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "relative flex items-center justify-between bg-background neo-border-thick",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-primary",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="pl-2 flex-1 min-w-0">
        <div className={cn("font-bold truncate", compact ? "text-sm" : "")}>
          {activity.challengeSlug ? (
            <Link
              to="/challenges/$slug"
              params={{ slug: activity.challengeSlug }}
              className="hover:text-primary transition-colors"
            >
              {activity.challengeTitle ?? activity.description}
            </Link>
          ) : (
            <span>{activity.challengeTitle ?? activity.description}</span>
          )}
        </div>
        <div
          className={cn(
            "text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {dateStr}
        </div>
      </div>
      <div
        className={cn(
          "ml-3 font-black text-primary-foreground bg-primary neo-border",
          compact ? "px-1.5 py-0.5 text-xs" : "px-1.5 py-0.5 text-sm",
        )}
      >
        +{activity.xpAmount} XP
      </div>
    </div>
  );
}

export function DashboardRecentActivity() {
  const { data: transactions } = useSuspenseQuery(xpTransactionsOptions());

  const recentXp = transactions
    ?.slice(0, PREVIEW_COUNT)
    .reduce((sum, tx) => sum + tx.xpAmount, 0);

  const monthGroups = groupByMonth(transactions ?? []);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-secondary neo-border-thick neo-shadow p-8 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary neo-border-thick">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-black">Recent Activity</h2>
        </div>
        <p className="text-muted-foreground font-bold">
          No activity yet. Complete a challenge to get started!
        </p>
      </div>
    );
  }

  return (
    <Dialog>
      <div className="bg-secondary neo-border-thick neo-shadow p-8 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary neo-border-thick">
            <History className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-black">Recent Activity</h2>
        </div>

        <div className="space-y-3 mb-6">
          {transactions.slice(0, PREVIEW_COUNT).map((tx) => (
            <ActivityItem key={tx.id} activity={tx} />
          ))}
        </div>

        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full neo-border neo-shadow font-black"
          >
            View All Activity
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black text-primary-foreground">
              Activity Log
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 bg-primary-foreground text-primary neo-border text-xs font-black">
                +{recentXp} XP recently
              </span>
              <span className="text-primary-foreground text-sm font-bold">
                {transactions.length} activities
              </span>
            </div>
          </div>
          <DialogClose className="text-primary-foreground hover:opacity-70 transition-opacity">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[55vh] p-6">
          <div className="space-y-6">
            {monthGroups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </span>
                  <div className="flex-1 h-[2px] bg-border" />
                </div>
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <ActivityItem key={tx.id} activity={tx} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
