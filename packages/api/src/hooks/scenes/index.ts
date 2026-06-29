import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import invariant from "tiny-invariant";
import type { components } from "../../generated-v1";
import { unwrap, v1Client } from "../util";

type Schemas = components["schemas"];
type SceneCreateSchema = Schemas["SceneCreateSchema"];
type ScenePatchSchema = Schemas["ScenePatchSchema"];

const detailKey = (key?: string) => ["scenes", "detail", String(key)];

const useScene = (
  key?: string,
  opts: { enabled?: boolean; staleTime?: number } = {},
) => {
  return useQuery({
    queryKey: detailKey(key),
    queryFn: () => {
      invariant(key, "When useScene is enabled, key is required");
      return unwrap(
        v1Client.GET("/v1/scenes/{key}/", { params: { path: { key } } }),
      );
    },
    ...opts,
  });
};

const meListKey = () => ["scenes", "me"];

const useInfiniteScenesMe = (
  {
    limit,
    offset,
    title,
    archived,
  }: {
    limit?: number;
    offset?: number;
    title?: string;
    archived?: boolean;
  } = {},
  opts?: { enabled?: boolean },
) => {
  return useInfiniteQuery({
    queryKey: [...meListKey(), { limit, offset, title, archived }],
    initialPageParam: offset ?? 0,
    queryFn: ({ pageParam }) =>
      unwrap(
        v1Client.GET("/v1/scenes/me/", {
          params: { query: { limit, offset: pageParam, title, archived } },
        }),
      ),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Empty page => nothing more to load (also guards against an infinite
      // loop if a malformed `count` ever exceeds the returnable item total).
      if (lastPage.items.length === 0) return undefined;
      const loaded = (lastPageParam ?? 0) + lastPage.items.length;
      return loaded < lastPage.count ? loaded : undefined;
    },
    ...opts,
  });
};

const useCreateScene = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SceneCreateSchema) =>
      unwrap(v1Client.POST("/v1/scenes/", { body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: meListKey(),
      });
    },
  });
};

const usePatchScene = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, patch }: { key: string; patch: ScenePatchSchema }) =>
      unwrap(
        v1Client.PATCH("/v1/scenes/{key}/", {
          params: { path: { key } },
          body: patch,
        }),
      ),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({
        queryKey: detailKey(vars.key),
      });
      if (vars.patch.archived !== undefined) {
        queryClient.invalidateQueries({
          queryKey: meListKey(),
        });
      }
    },
  });
};

const useDestroyScene = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) =>
      unwrap(
        v1Client.DELETE("/v1/scenes/{key}/", { params: { path: { key } } }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: meListKey(),
      });
    },
  });
};

export {
  useInfiniteScenesMe,
  useCreateScene,
  useScene,
  usePatchScene,
  useDestroyScene,
};
