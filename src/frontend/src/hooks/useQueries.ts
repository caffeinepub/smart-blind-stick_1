import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Location } from "../backend";
import { Status } from "../backend";
import { useActor } from "./useActor";

export function useGetAllLocations() {
  const { actor, isFetching } = useActor();
  return useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLocations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStatistics() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      if (!actor)
        return {
          totalCount: BigInt(0),
          emergencyCount: BigInt(0),
          lastLocation: undefined,
        };
      return actor.getStatistics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddLocation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      latitude,
      longitude,
    }: { latitude: number; longitude: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.addLocation(latitude, longitude);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useDeleteLocation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteLocation(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useToggleStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.toggleStatus(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export { Status };
export type { Location };
