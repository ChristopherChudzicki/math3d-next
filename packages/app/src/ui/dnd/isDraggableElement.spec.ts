import isDraggableElement from "./isDraggableElement";

const inside = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  const target = container.querySelector("[data-target]");
  if (!(target instanceof HTMLElement)) throw new Error("No [data-target]");
  return target;
};

test.each([
  { html: `<div><span data-target></span></div>`, draggable: true },
  { html: `<button><span data-target></span></button>`, draggable: false },
  {
    html: `<span role="switch"><span data-target></span></span>`,
    draggable: false,
  },
  {
    html: `<div data-dndkit-no-drag="true"><span data-target></span></div>`,
    draggable: false,
  },
])("isDraggableElement($html) is $draggable", ({ html, draggable }) => {
  expect(isDraggableElement(inside(html))).toBe(draggable);
});
