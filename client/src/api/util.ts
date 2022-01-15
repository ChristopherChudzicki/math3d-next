const fetchJson = async <T>(
  requestInfo: RequestInfo,
  requestInit?: RequestInit
): Promise<T> => {
  const request = await fetch(requestInfo, requestInit);
  return (await request.json()) as T;
};

export { fetchJson };
