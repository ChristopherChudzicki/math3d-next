import { afterEach, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { stubWebGpu } from "@/test_util";
import {
  markWebGpuFailed,
  startWebGpuDetection,
  useWebGpuSupport,
} from "./webgpuSupport";

afterEach(() => {
  vi.useRealTimers();
});

test("no navigator.gpu is unavailable", () => {
  const { result } = renderHook(useWebGpuSupport);

  expect(result.current).toBe("unavailable");
});

test("an adapter makes it available", async () => {
  stubWebGpu();
  const { result } = renderHook(useWebGpuSupport);
  expect(result.current).toBe("pending");

  act(startWebGpuDetection);

  await waitFor(() => expect(result.current).toBe("available"));
});

test.each([
  { failure: "a null adapter", requestAdapter: async () => null },
  {
    failure: "a rejection",
    requestAdapter: () => Promise.reject(new Error("no adapter")),
  },
])("$failure is unavailable", async ({ requestAdapter }) => {
  stubWebGpu(requestAdapter);
  const { result } = renderHook(useWebGpuSupport);

  act(startWebGpuDetection);

  await waitFor(() => expect(result.current).toBe("unavailable"));
});

test("no answer within 2 s is unavailable", async () => {
  vi.useFakeTimers();
  stubWebGpu(() => new Promise(() => {}));
  const { result } = renderHook(useWebGpuSupport);
  act(startWebGpuDetection);

  await act(() => vi.advanceTimersByTimeAsync(1999));
  expect(result.current).toBe("pending");

  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(result.current).toBe("unavailable");
});

test("detection runs once per page load", async () => {
  const requestAdapter = vi.fn(async () => ({}));
  stubWebGpu(requestAdapter);
  const { result } = renderHook(useWebGpuSupport);

  act(startWebGpuDetection);
  act(startWebGpuDetection);

  await waitFor(() => expect(result.current).toBe("available"));
  expect(requestAdapter).toHaveBeenCalledExactlyOnceWith({
    powerPreference: "low-power",
  });
});

test("a late adapter doesn't undo a device failure", async () => {
  const adapter = Promise.withResolvers<unknown>();
  stubWebGpu(() => adapter.promise);
  const { result } = renderHook(useWebGpuSupport);
  act(startWebGpuDetection);

  act(() => {
    markWebGpuFailed();
  });
  await act(async () => adapter.resolve({}));

  expect(result.current).toBe("failed");
});

test("markWebGpuFailed reports only the call that changes state", () => {
  stubWebGpu();

  expect(markWebGpuFailed()).toBe(true);
  expect(markWebGpuFailed()).toBe(false);
});
