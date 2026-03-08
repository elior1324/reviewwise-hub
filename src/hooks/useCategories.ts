import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCategories(type: "freelancer" | "course") {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_categories" as any)
        .select("name")
        .eq("type", type)
        .order("name");

      if (error) throw error;
      return (data as any[]).map((c: any) => c.name as string);
    },
    staleTime: 5 * 60 * 1000,
  });
}
