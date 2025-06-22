// hooks/useMonthlyLeadsSummary.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import { useEffect } from "react";

export const useMonthlyLeadsSummary = () => {
  const queryClient = useQueryClient();

  // Subscribe to changes in the `mock` table to trigger refetch of the view
  useEffect(() => {
    const channel = supabase
      .channel("monthly-leads-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mock" },
        (payload) => {
          console.log("Realtime change in mock table:", payload);
          queryClient.invalidateQueries(["monthly_leads_summary"]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch from the monthly_leads_summary view
  const query = useQuery({
    queryKey: ["monthly_leads_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_leads_summary")
        .select("*")
        .order("year", { ascending: true })
        .order("month", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 0,
    cacheTime: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
