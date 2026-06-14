import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/types";
import { fetchMe } from "../api/client";

interface AuthValue {
  user: User | null;
  isEditor: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  isEditor: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
  });

  const user = data ?? null;
  const value: AuthValue = {
    user,
    isEditor: user?.role === "editor",
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
