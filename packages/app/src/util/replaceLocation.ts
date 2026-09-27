/** A full page load that replaces the current history entry. */
const replaceLocation = (url: string): void => {
  window.location.replace(url);
};

export { replaceLocation };
