import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { DefaultApi } from "../../generated-v1";
import type { SceneCreateSchema, ScenePatchSchema } from "../../generated-v1";
import { getConfig } from "../util";

const scenesApi = new DefaultApi(getConfig());

const detailKey = (key?: string) => ["scenes", "detail", String(key)];

const useScene = (
  key?: string,
  opts: { enabled?: boolean; staleTime?: number } = {},
) => {
  return useQuery({
    queryKey: detailKey(key),
    queryFn: () => {
      invariant(key, "When useScene is enabled, key is required");
      return scenesApi.scenesApiGetScene({ key }).then((res) => res.data);
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
      scenesApi
        .scenesApiMyScenes({
          limit,
          offset: pageParam,
          title,
          archived,
        })
        .then((res) => res.data),
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
    mutationFn: (data: SceneCreateSchema) => {
      return scenesApi
        .scenesApiCreateScene({
          SceneCreateSchema: data,
        })
        .then((res) => res.data);
    },
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
      scenesApi.scenesApiUpdateScene({ key, ScenePatchSchema: patch }),
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
    mutationFn: (key: string) => scenesApi.scenesApiDeleteScene({ key }),
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
