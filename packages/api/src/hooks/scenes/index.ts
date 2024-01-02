import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { ScenesApi } from "../../generated";
import type { ScenesApiScenesCreateRequest } from "../../generated";
import { getConfig } from "../util";

const scenesApi = new ScenesApi(getConfig());

const useScene = (key?: string, opts?: Pick<UseQueryOptions, "enabled">) => {
  return useQuery({
    queryKey: ["scenes", "detail", key],
    queryFn: () => {
      invariant(key, "When useScene is enabled, key is required");
      return scenesApi.scenesRetrieve({ key }).then((res) => res.data);
    },
    ...opts,
  });
};

const useCreateScene = () => {
  return useMutation({
    mutationFn: (data: ScenesApiScenesCreateRequest) => {
      return scenesApi.scenesCreate(data).then((res) => res.data);
    },
  });
};

const useInfiniteScenesMe = ({
  limit,
  offset,
  title,
}: { limit?: number; offset?: number; title?: string } = {}) => {
  return useInfiniteQuery({
    queryKey: ["scenes", "me", { limit, offset, title }],
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
  });
};

export { useInfiniteScenesMe, useCreateScene, useScene };
