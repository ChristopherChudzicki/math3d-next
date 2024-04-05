import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { ScenesApi } from "../../generated";
import type { PatchedSceneRequest, SceneCreateRequest } from "../../generated";
import { getConfig } from "../util";

const scenesApi = new ScenesApi(getConfig());

const detailKey = (key?: string) => ["scenes", "detail", key];

const useScene = (
  key?: string,
  opts?: Pick<UseQueryOptions, "enabled" | "staleTime">,
) => {
  return useQuery({
    queryKey: detailKey(key),
    queryFn: () => {
      invariant(key, "When useScene is enabled, key is required");
      return scenesApi.scenesRetrieve({ key }).then((res) => res.data);
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
  opts: Pick<UseInfiniteQueryOptions, "enabled"> = {},
) => {
  return useInfiniteQuery({
    queryKey: [...meListKey(), { limit, offset, title, archived }],
    initialPageParam: offset,
    queryFn: ({ pageParam }) =>
      scenesApi
        .scenesMeList({
          limit,
          offset: pageParam,
          title,
          archived,
        })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get("offset"));
    },
    ...opts,
  });
};

const useCreateScene = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SceneCreateRequest) => {
      return scenesApi
        .scenesCreate({
          SceneCreateRequest: data,
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
    mutationFn: ({ key, patch }: { key: string; patch: PatchedSceneRequest }) =>
      scenesApi.scenesPartialUpdate({ key, PatchedSceneRequest: patch }),
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
    mutationFn: (key: string) => scenesApi.scenesDestroy({ key }),
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
