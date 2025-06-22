import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const useUserRole = (userId) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
      } else {
        setRole(data.role);
      }
    };

    fetchRole();
  }, [userId]);

  return role;
};
export default useUserRole;
