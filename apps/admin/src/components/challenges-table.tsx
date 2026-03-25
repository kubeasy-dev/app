import type { AdminChallengeItem, AdminChallengeListOutput } from "@kubeasy/api-schemas/challenges";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@kubeasy/ui/badge";
import { Switch } from "@kubeasy/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kubeasy/ui/table";
import { apiFetch } from "@/lib/api-client";

interface ChallengesTableProps {
  challenges: AdminChallengeItem[];
}

function getDifficultyClassName(difficulty: AdminChallengeItem["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return "text-green-600";
    case "medium":
      return "text-yellow-600";
    case "hard":
      return "text-red-600";
  }
}

export function ChallengesTable({ challenges }: ChallengesTableProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, available }: { id: number; available: boolean }) =>
      apiFetch(`/admin/challenges/${id}/available`, {
        method: "PATCH",
        body: JSON.stringify({ available }),
      }),
    onMutate: async ({ id, available }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "challenges"] });
      const previous = queryClient.getQueryData<AdminChallengeListOutput>(["admin", "challenges"]);
      queryClient.setQueryData<AdminChallengeListOutput>(["admin", "challenges"], (old) => ({
        challenges: old?.challenges.map((c) => c.id === id ? { ...c, available } : c) ?? [],
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["admin", "challenges"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Theme</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Completion %</TableHead>
          <TableHead>Success Rate %</TableHead>
          <TableHead>Available</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {challenges.map((challenge) => {
          const completionPct =
            challenge.starts > 0
              ? `${((challenge.completions / challenge.starts) * 100).toFixed(1)}%`
              : "—";
          const successRatePct =
            challenge.totalSubmissions > 0
              ? `${((challenge.successfulSubmissions / challenge.totalSubmissions) * 100).toFixed(1)}%`
              : "—";

          return (
            <TableRow key={challenge.id}>
              <TableCell className="font-medium">{challenge.title}</TableCell>
              <TableCell>{challenge.theme}</TableCell>
              <TableCell>{challenge.type}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getDifficultyClassName(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(challenge.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>{completionPct}</TableCell>
              <TableCell>{successRatePct}</TableCell>
              <TableCell>
                <Switch
                  checked={challenge.available}
                  onCheckedChange={() =>
                    mutation.mutate({ id: challenge.id, available: !challenge.available })
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
