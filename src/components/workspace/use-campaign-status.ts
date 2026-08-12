import { useQuery } from "@tanstack/react-query";
import { fetchCampaignStatus } from "@/lib/api";

export function useCampaignStatus(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-status", campaignId],
    queryFn: async () => {
      const result = await fetchCampaignStatus(campaignId ?? "");
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(campaignId),
    retry: false,
    refetchInterval: (query) => (query.state.data?.is_running ? 3000 : false),
  });
}
