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
import type { SceneCreateRequest } from "../../generated";
import { getConfig } from "../util";

const scenesApi = new ScenesApi(getConfig());

const detailKey = (key?: string) => ["scenes", "detail", key];

const useScene = (key?: string, opts?: Pick<UseQueryOptions, "enabled">) => {
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
  }: { limit?: number; offset?: number; title?: string } = {},
  opts: Pick<UseInfiniteQueryOptions, "enabled"> = {},
) => {
  return useInfiniteQuery({
    queryKey: [...meListKey(), { limit, offset, title }],
    initialPageParam: offset,
    queryFn: ({ pageParam }) =>
      scenesApi
        .scenesMeList({
          limit,
          offset: pageParam,
          title,
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

export { useInfiniteScenesMe, useCreateScene, useScene };
