import React from "react";
import { act } from "@testing-library/react";
import { renderWithRouter } from "@/test_util/routerTesting";
import { useSetSearch } from "./useSetSearch";

test.each([
  // Each row fails without one option: `resetScroll` for the first,
  // `hashScrollIntoView` for the second.
  "/x",
  "/x#h",
])("editing %s's search params doesn't scroll", async (url) => {
  let setSearch: ReturnType<typeof useSetSearch> = () => Promise.resolve();
  const Probe: React.FC = () => {
    setSearch = useSetSearch();
    return <h2 id="h">Section</h2>;
  };
  await renderWithRouter(<Probe />, { url });
  // Spied after the first load, which scrolls by itself, and restored so the
  // next row's first load isn't counted.
  const scrollTo = vi.spyOn(window, "scrollTo");
  const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
  onTestFinished(() => {
    scrollTo.mockRestore();
    scrollIntoView.mockRestore();
  });

  await act(async () => setSearch({ overlay: "logout" }));

  expect(scrollTo).not.toHaveBeenCalled();
  expect(scrollIntoView).not.toHaveBeenCalled();
});
