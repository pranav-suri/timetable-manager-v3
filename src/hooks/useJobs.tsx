import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PartialGAConfig } from "@/server/services/timetableGenerator/types";
import { trpcClient } from "@/integrations/trpc";

export function useJobs(timetableId: string) {
  const queryClient = useQueryClient();

  // Query for jobs list
  const jobsQuery = useQuery({
    queryKey: ["jobs", timetableId],
    queryFn: async () => {
      const result = await trpcClient.generate.list.query({ timetableId });
      return result;
    },
    enabled: !!timetableId,
    refetchInterval: (query) => {
      // Refetch every 5 seconds if there are active jobs
      const data = query.state.data as any;
      const hasActiveJobs = data?.jobs?.some(
        (job: any) => job.status === "IN_PROGRESS" || job.status === "PENDING",
      );
      if (hasActiveJobs) {
        return 5000;
      }
      return false;
    },
  });

  // Query for individual job status
  const useJobStatus = (jobId: string) => {
    return useQuery({
      queryKey: ["job", jobId],
      queryFn: async () => {
        const result = await trpcClient.generate.status.query({ jobId });

        // If job status changed to completed/failed/cancelled, invalidate jobs list
        const previousData = queryClient.getQueryData(["job", jobId]);
        if (
          previousData &&
          (previousData.status === "IN_PROGRESS" ||
            previousData.status === "PENDING") &&
          (result.status === "COMPLETED" ||
            result.status === "FAILED" ||
            result.status === "CANCELLED")
        ) {
          queryClient.invalidateQueries({ queryKey: ["jobs", timetableId] });
        }

        return result;
      },
      enabled: !!jobId,
      refetchInterval: (query) => {
        // Refetch every 2 seconds if job is in progress
        const data = query.state.data as any;
        if (data?.status === "IN_PROGRESS" || data?.status === "PENDING") {
          return 2000;
        }
        return false;
      },
    });
  };

  // Start generation mutation
  const startGenerationMutation = useMutation({
    mutationFn: async (config?: PartialGAConfig) => {
      const result = await trpcClient.generate.start.mutate({
        timetableId,
        config,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", timetableId] });
      console.log("Timetable generation started");
    },
    onError: (error) => {
      console.error("Failed to start generation:", error.message);
    },
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const result = await trpcClient.generate.cancel.mutate({ jobId });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", timetableId] });
      console.log("Job cancelled");
    },
    onError: (error) => {
      console.error("Failed to cancel job:", error.message);
    },
  });

  return {
    // Queries
    jobs: jobsQuery.data?.jobs || [],
    isLoading: jobsQuery.isLoading,
    error: jobsQuery.error,
    useJobStatus,

    // Mutations
    startGeneration: startGenerationMutation.mutate,
    isStarting: startGenerationMutation.isPending,
    cancelJob: cancelJobMutation.mutate,
    isCancelling: cancelJobMutation.isPending,

    // Utils
    refetch: jobsQuery.refetch,
  };
}
