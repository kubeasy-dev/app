"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Target,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { useRealtime } from "@/lib/realtime-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import type { Objective, ObjectiveCategory } from "@/types/cli-api";
import { SubmissionItem } from "./challenge-status/submission-item";

interface ChallengeMissionProps {
  slug: string;
}

const CATEGORY_LABELS: Record<ObjectiveCategory, string> = {
  status: "Status",
  condition: "Condition",
  log: "Logs",
  event: "Events",
  connectivity: "Network",
};

const CATEGORY_COLORS: Record<ObjectiveCategory, string> = {
  status: "bg-purple-100 text-purple-700",
  condition: "bg-indigo-100 text-indigo-700",
  log: "bg-blue-100 text-blue-700",
  event: "bg-orange-100 text-orange-700",
  connectivity: "bg-cyan-100 text-cyan-700",
};

// Display objective with status: pending (no submission), passed, or failed
interface DisplayObjective {
  id: string;
  objectiveKey: string;
  title: string;
  description: string | null;
  category: ObjectiveCategory;
  // Status: null = pending (no submission yet), true = passed, false = failed
  status: boolean | null;
  // Message from validation result (only when status is not null)
  message?: string;
}

export function ChallengeMission({ slug }: ChallengeMissionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // Check if user is authenticated before making private API calls
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const isAuthenticated = !!session;

  // Fetch predefined objectives from database (public endpoint)
  const { data: objectivesData, isLoading: isLoadingObjectives } = useQuery({
    ...trpc.challenge.getObjectives.queryOptions({ slug }),
  });

  // Load initial validation status (real-time updates via SSE subscription below)
  const { data: validationStatus, isLoading: isLoadingValidation } = useQuery({
    ...trpc.userProgress.getLatestValidationStatus.queryOptions({ slug }),
    enabled: isAuthenticated,
  });

  // ✅ Real-time updates via Upstash Realtime
  // Automatically invalidates queries when validation events are received
  useRealtime({
    enabled: isAuthenticated && !!session?.user?.id,
    channels: session?.user?.id ? [`${session.user.id}:${slug}`] : [],
    events: ["validation.update"],
    onData() {
      // Validation event received - invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: trpc.userProgress.getLatestValidationStatus.queryKey({
          slug,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.userProgress.getSubmissions.queryKey({ slug }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.userProgress.getStatus.queryKey({ slug }),
      });
    },
  });

  // Fetch submissions for history modal (only when authenticated)
  // No polling - updates via subscription invalidation
  const { data: submissionsData } = useQuery({
    ...trpc.userProgress.getSubmissions.queryOptions({ slug }),
    enabled: isAuthenticated,
  });

  // Fetch challenge status to determine if it's started or not (only when authenticated)
  // No polling - updates via subscription invalidation
  const { data: statusData } = useQuery({
    ...trpc.userProgress.getStatus.queryOptions({ slug }),
    enabled: isAuthenticated,
  });

  const status = statusData?.status ?? "not_started";
  const isLoading =
    isLoadingObjectives ||
    isSessionLoading ||
    (isAuthenticated && isLoadingValidation);

  // Merge predefined objectives with submission results
  const displayObjectives = useMemo((): DisplayObjective[] => {
    const predefinedObjectives = objectivesData?.objectives ?? [];
    const submissionObjectives = validationStatus?.hasSubmission
      ? (validationStatus.objectives as Objective[] | null)
      : null;

    // If no predefined objectives, fall back to submission objectives (for backward compat)
    if (predefinedObjectives.length === 0 && submissionObjectives) {
      return submissionObjectives.map((obj) => ({
        id: obj.id,
        objectiveKey: obj.id,
        title: obj.name,
        description: obj.description ?? null,
        category: obj.category,
        status: obj.passed,
        message: obj.message,
      }));
    }

    // Map predefined objectives and merge with submission results
    return predefinedObjectives.map((predefined) => {
      // Find matching submission result by objectiveKey
      const submissionResult = submissionObjectives?.find(
        (sub) => sub.id === predefined.objectiveKey,
      );

      return {
        id: String(predefined.id),
        objectiveKey: predefined.objectiveKey,
        title: predefined.title,
        description: predefined.description,
        category: predefined.category as ObjectiveCategory,
        // null = pending (no submission), true/false = passed/failed
        status: submissionResult ? submissionResult.passed : null,
        message: submissionResult?.message,
      };
    });
  }, [objectivesData, validationStatus]);

  // Calculate overall progress
  const totalObjectives = displayObjectives.length;
  const passedObjectives = displayObjectives.filter(
    (obj) => obj.status === true,
  ).length;
  const hasAnySubmission = displayObjectives.some((obj) => obj.status !== null);

  // Determine if challenge is completed
  const isCompleted = status === "completed";

  // Status icon component
  const StatusIcon = ({ objStatus }: { objStatus: boolean | null }) => {
    if (objStatus === null) {
      // Pending - no submission yet
      return <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />;
    }
    if (objStatus) {
      return <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />;
    }
    return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
  };

  return (
    <Card className="neo-border-thick neo-shadow-xl bg-secondary">
      <CardHeader>
        <CardTitle className="text-2xl font-black flex items-center gap-3">
          <Target className="h-6 w-6" />
          Your Mission
          {totalObjectives > 0 && (
            <span className="ml-auto text-base font-bold">
              {passedObjectives}/{totalObjectives}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              Loading validation status...
            </span>
          </div>
        )}

        {/* Success Message - only when completed */}
        {isCompleted && (
          <div className="bg-green-50 neo-border-thick rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <p className="font-bold text-green-900">
                Congratulations! You've successfully completed this challenge.
              </p>
            </div>
          </div>
        )}

        {/* Objectives Checklist - Flat list (ABOVE CLI commands) */}
        {!isLoading && displayObjectives.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-bold">
              Complete the objectives below and submit your solution:
            </p>

            <div className="space-y-2">
              {displayObjectives.map((obj) => (
                <div
                  key={obj.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg neo-border",
                    obj.status === true
                      ? "bg-green-50"
                      : obj.status === false
                        ? "bg-red-50"
                        : "bg-white",
                  )}
                >
                  <StatusIcon objStatus={obj.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{obj.title}</p>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          CATEGORY_COLORS[obj.category] ||
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {CATEGORY_LABELS[obj.category] || obj.category}
                      </span>
                    </div>
                    {obj.description && (
                      <p className="text-sm text-foreground/70 mt-1">
                        {obj.description}
                      </p>
                    )}
                    {obj.message && (
                      <p
                        className={cn(
                          "text-sm mt-2 font-medium",
                          obj.status === true
                            ? "text-green-700"
                            : "text-red-600",
                        )}
                      >
                        {obj.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Last Updated - only if there's a submission */}
            {hasAnySubmission && validationStatus?.timestamp && (
              <p className="text-xs text-muted-foreground text-right font-medium">
                Last updated:{" "}
                {new Date(validationStatus.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* CLI Commands */}
        <div className="space-y-3">
          {isCompleted ? (
            <>
              <p className="text-sm font-bold">Clean up the resources with:</p>
              <div className="bg-black text-green-400 p-3 rounded-lg neo-border-thick font-mono text-sm">
                <span className="text-gray-500">$</span> kubeasy challenge clean{" "}
                {slug}
              </div>
            </>
          ) : status === "not_started" ? (
            <>
              <p className="text-sm font-bold">
                Start this challenge in your local Kubernetes cluster:
              </p>
              <div className="bg-black text-green-400 p-3 rounded-lg neo-border-thick font-mono text-sm">
                <span className="text-gray-500">$</span> kubeasy challenge start{" "}
                {slug}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">Submit your solution:</p>
              <div className="bg-black text-green-400 p-3 rounded-lg neo-border-thick font-mono text-sm">
                <span className="text-gray-500">$</span> kubeasy challenge
                submit {slug}
              </div>
            </>
          )}

          {/* History button - only show if there are submissions */}
          {submissionsData && submissionsData.submissions.length > 0 && (
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="neo-border font-bold"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View History ({submissionsData.submissions.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto neo-border-thick">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    Submission History
                  </DialogTitle>
                  <DialogDescription>
                    Previous attempts for this challenge
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  {submissionsData.submissions.map((submission) => (
                    <SubmissionItem
                      key={submission.id}
                      submission={submission}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* No objectives in database (backward compat) */}
        {!isLoading && displayObjectives.length === 0 && !hasAnySubmission && (
          <p className="text-sm font-medium text-muted-foreground">
            Submit your solution to see validation progress.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
