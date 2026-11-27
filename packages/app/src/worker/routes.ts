/**
 * The SPA's routes as TanStack path strings; `app/router.ts` checks them against
 * the route tree's `fullPaths`. That check pulls this file into the app's
 * program too, so it imports nothing and uses no runtime-specific globals.
 */
export const ROUTE_PATHS = [
  "/{-$sceneKey}",
  "/app/frame/$sceneKey",
  "/app/help/reference",
  "/app/sign-in-error",
] as const;

type Params = Record<string, string | undefined>;

export interface RouteMatch<P extends string = (typeof ROUTE_PATHS)[number]> {
  path: P;
  params: Params;
}

type Segment =
  | { kind: "literal"; value: string }
  | { kind: "param"; name: string; optional: boolean };

const parseSegment = (segment: string): Segment => {
  const param = /^\$(\w+)$/.exec(segment);
  if (param) return { kind: "param", name: param[1], optional: false };
  const optional = /^\{-\$(\w+)\}$/.exec(segment);
  if (optional) return { kind: "param", name: optional[1], optional: true };
  if (/[$*{}]/.test(segment)) {
    throw new Error(`Unsupported route segment: ${segment}`);
  }
  return { kind: "literal", value: segment };
};

/** Literals before params before optional params, like the router's ranking. */
const rank = (segment: Segment) => {
  if (segment.kind === "literal") return 0;
  return segment.optional ? 2 : 1;
};

const byRank = (a: Segment[], b: Segment[]): number => {
  const i = a.findIndex(
    (segment, j) => rank(segment) !== rank(b[j] ?? segment),
  );
  return i === -1 ? 0 : rank(a[i]) - rank(b[i]);
};

const matchSegments = (
  pattern: Segment[],
  segments: string[],
): Params | null => {
  const [head, ...rest] = pattern;
  if (head === undefined) return segments.length === 0 ? {} : null;
  const [segment, ...remaining] = segments;
  if (head.kind === "literal") {
    return segment === head.value ? matchSegments(rest, remaining) : null;
  }
  const taken = segment === undefined ? null : matchSegments(rest, remaining);
  if (taken) return { ...taken, [head.name]: segment };
  return head.optional ? matchSegments(rest, segments) : null;
};

/**
 * A function giving the route the router would render a pathname with, and its
 * decoded params, or null for its not-found page. Like the router: case-
 * sensitive, empty segments (trailing or doubled slashes) ignored, segments
 * decoded after splitting, a literal segment preferred over a param.
 */
export const routeMatcher = <P extends string>(paths: readonly P[]) => {
  const patterns = paths
    .map((path) => ({
      path,
      segments: path.split("/").filter(Boolean).map(parseSegment),
    }))
    .sort((a, b) => byRank(a.segments, b.segments));
  return (pathname: string): RouteMatch<P> | null => {
    let segments: string[];
    try {
      segments = pathname.split("/").filter(Boolean).map(decodeURIComponent);
    } catch {
      return null; // a malformed escape
    }
    return patterns.reduce<RouteMatch<P> | null>(
      (found, { path, segments: p }) => {
        if (found) return found;
        const params = matchSegments(p, segments);
        return params && { path, params };
      },
      null,
    );
  };
};

export const matchRoute = routeMatcher(ROUTE_PATHS);
