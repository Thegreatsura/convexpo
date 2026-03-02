import { api } from "@my-better-t-app/backend";
import { useQuery } from "convex/react";
import type React from "react";
import { createContext, useContext, useMemo } from "react";

/**
 * User type from getCurrentUser query.
 * Better Auth manages user schema, so we infer from the query return type.
 */
type User = NonNullable<typeof api.auth.getCurrentUser._returnType>;

type UserContextType = {
	/** The authenticated user, or null if not authenticated */
	user: User | null;
	/** Whether the user query is still loading */
	isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Access the current user from Convex.
 *
 * The query cache persists across HMR (ConvexReactClient is at module scope),
 * so `user` won't flicker during hot reloads — unlike useConvexAuth().
 *
 * Use `!!user` for navigation guards instead of `isAuthenticated`.
 */
export function useUser() {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error("useUser must be used within UserProvider");
	}
	return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
	// Query the current user from Convex.
	// Returns undefined while loading, null if not authenticated, or User if authenticated.
	const queryResult = useQuery(api.auth.getCurrentUser);

	const value = useMemo<UserContextType>(
		() => ({
			user: queryResult ?? null,
			isLoading: queryResult === undefined,
		}),
		[queryResult],
	);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
