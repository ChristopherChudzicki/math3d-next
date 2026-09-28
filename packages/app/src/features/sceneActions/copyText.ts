/** Resolves `false` when the browser refuses, e.g. outside a secure context. */
const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default copyText;
