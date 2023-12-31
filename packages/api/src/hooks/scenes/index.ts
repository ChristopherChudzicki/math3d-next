import { useInfiniteQuery } from "@tanstack/react-query";
import { ScenesApi } from "../../generated";
import { getConfig } from "../util";

const scenesApi = new ScenesApi(getConfig());

const useInfiniteScenesMe = ({
  limit,
  offset,
}: { limit?: number; offset?: number } = {}) => {
  return useInfiniteQuery({
    queryKey: ["scenes", "me", { limit, offset }],
    initialPageParam: offset,
    queryFn: ({ pageParam }) =>
      scenesApi
        .scenesMeList({
          limit,
          offset: pageParam,
        })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get("offset"));
    },
  });
};

export { useInfiniteScenesMe };
