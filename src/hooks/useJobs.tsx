import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  });

  // Query for individual job status
  const useJobStatus = (jobId: string) => {
    return useQuery({
      queryKey: ["job", jobId],
      queryFn: async () => {
        const result = await trpcClient.generate.status.query({ jobId });
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
    mutationFn: async () => {
      const result = await trpcClient.generate.start.mutate({
        timetableId,
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
