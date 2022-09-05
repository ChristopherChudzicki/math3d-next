/* eslint-disable no-console */

const originalConsoleError = console.error.bind(console);

interface ConsoleErrorArgs {
  ignoreStr?: string;
  ignoreData?: string;
}

/**
 * Suppress deprecration warnings from React due to antd
 * https://github.com/ant-design/ant-design/issues/31805
 */
const patchConsoleError = (patterns: ConsoleErrorArgs[]) => {
  const patched = (message: string, ...data: string[]) => {
    const shouldIgnore = patterns.some((pattern) => {
      return (
        (pattern.ignoreStr && message.includes(pattern.ignoreStr)) ||
        (pattern.ignoreData && data.includes(pattern.ignoreData))
      );
    });
    if (process.env.NODE_ENV === "test" && shouldIgnore) return;
    originalConsoleError(message, ...data);
  };

  console.error = patched;
  const restore = () => {
    console.error = originalConsoleError;
  };
  return restore;
};

export default patchConsoleError;
