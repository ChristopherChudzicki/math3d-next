const interactiveTags = [
  "textarea",
  "input",
  "button",
  "select",
  "option",
  "optgroup",
  "video",
  "audio",
];

// Base UI renders some controls (Switch, Checkbox, Tabs) as spans or divs.
const interactiveRoles = ["switch", "checkbox", "slider", "tab"];

const getPathToRoot = (el: HTMLElement): HTMLElement[] => {
  const path = [el];
  let current = el;
  while (current.parentElement) {
    path.push(current.parentElement);
    current = current.parentElement;
  }
  return path;
};

const isInteractive = (el: HTMLElement) => {
  if (el.isContentEditable) return true;
  if (interactiveRoles.includes(el.getAttribute("role") ?? "")) return true;
  return interactiveTags.includes(el.tagName.toLowerCase());
};
const isDraggableElement = (el: HTMLElement) => {
  const path = getPathToRoot(el);
  return !path.some((pathEl) => {
    if (isInteractive(pathEl)) return true;
    if (pathEl.dataset.dndkitNoDrag) return true;
    return false;
  });
};

export default isDraggableElement;
