import { http, HttpResponse } from "msw";
import type { PagedMiniSceneSchema, Scene, User } from "@math3d/api";
import db from "./db";

type ErrorResponseBody = Record<string, string | string[]>;

/**
 * In the mock API, we simulate session auth by tracking the "logged in" user
 * via a module-level variable. The real app uses cookies, but MSW intercepts
 * don't have real cookie support, so this is the simplest approach for tests.
 */
let currentUserId: number | null = null;

export const mockAuth = {
  setCurrentUser: (userId: number | null) => {
    currentUserId = userId;
  },
};

type DbScene = NonNullable<ReturnType<typeof db.scene.findFirst>>;

/** A stored scene as the detail endpoints return it: no `imageUrl`, which
 * the real API computes only for its list responses. */
const toScene = ({ imageUrl: _imageUrl, ...scene }: DbScene): Scene => ({
  ...scene,
  itemOrder: JSON.parse(scene.itemOrder),
});

const getUser = () => {
  // Session-based auth: check module-level current user
  if (currentUserId !== null) {
    const user = db.user.findFirst({
      where: { id: { equals: currentUserId } },
    });
    if (user) return user;
  }
  return false;
};

const BASE_URL: string = import.meta.env?.VITE_API_BASE_URL ?? "";

type NoParams = Record<string, never>;
export const urls = {
  scenes: {
    detail: `${BASE_URL}/v1/scenes/:key/`,
    list: `${BASE_URL}/v1/scenes/`,
    meList: `${BASE_URL}/v1/scenes/me/`,
  },
  auth: {
    usersMe: `${BASE_URL}/v1/auth/users/me/`,
    // allauth headless endpoints
    session: `${BASE_URL}/_allauth/browser/v1/auth/session`,
  },
} as const;

export const handlers = [
  // v1: my scenes. The anonymous response is a 403, not Ninja's default 401:
  // main/api.py remaps AuthenticationError because session auth cannot send a
  // compliant WWW-Authenticate challenge.
  // Filters, orders and paginates as the real endpoint does.
  http.get<NoParams, ErrorResponseBody | PagedMiniSceneSchema>(
    urls.scenes.meList,
    async ({ request }) => {
      const user = getUser();
      if (!user) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }
      const params = new URL(request.url).searchParams;
      const title = params.get("title")?.toLowerCase();
      const archived = params.get("archived");
      const offset = Number(params.get("offset") ?? 0);
      const limit = Number(params.get("limit") ?? 100);

      const scenes = db.scene
        .findMany({ where: { author: { equals: user.id } } })
        .filter((s) => !title || s.title.toLowerCase().includes(title))
        .filter((s) => archived === null || String(s.archived) === archived)
        .sort(
          (a, b) => Date.parse(b.modifiedDate) - Date.parse(a.modifiedDate),
        );
      const items = scenes.slice(offset, offset + limit).map((s) => ({
        title: s.title,
        key: s.key,
        author: s.author,
        archived: s.archived,
        createdDate: s.createdDate,
        modifiedDate: s.modifiedDate,
        imageUrl: s.imageUrl,
      }));
      return HttpResponse.json({
        count: scenes.length,
        items,
      });
    },
  ),
  http.get<{ key: string }, null, ErrorResponseBody | Scene>(
    urls.scenes.detail,
    ({ params }) => {
      const { key } = params;
      if (typeof key !== "string") {
        throw new Error("key should be string");
      }
      const scene = db.scene.findFirst({
        where: { key: { equals: key } },
      });
      if (!scene) {
        // Ninja's default Http404 body.
        return HttpResponse.json({ detail: "Not Found" }, { status: 404 });
      }
      return HttpResponse.json(toScene(scene));
    },
  ),
  http.post<NoParams, Scene, ErrorResponseBody | Scene>(
    urls.scenes.list,
    async ({ request }) => {
      const { title, items, itemOrder } = await request.json();
      if (typeof title !== "string") {
        throw new Error("title should be string");
      }
      if (!Array.isArray(items)) {
        throw new Error("items should be array");
      }
      if (!itemOrder) {
        throw new Error("itemOrder should be object");
      }
      const user = getUser();
      const sceneRecord = db.scene.create({
        title,
        items,
        itemOrder: JSON.stringify(itemOrder),
        author: user ? user.id : null,
        isLegacy: false,
      });
      return HttpResponse.json(toScene(sceneRecord), { status: 201 });
    },
  ),
  http.patch<{ key: string }, Partial<Scene>, ErrorResponseBody | Scene>(
    urls.scenes.detail,
    async ({ params, request }) => {
      // As the real API: authentication, then existence, then ownership.
      const user = getUser();
      if (!user) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }
      const where = { key: { equals: params.key } };
      const scene = db.scene.findFirst({ where });
      if (!scene) {
        return HttpResponse.json({ detail: "Not Found" }, { status: 404 });
      }
      if (scene.author !== user.id) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }
      const { title, items, itemOrder, archived } = await request.json();
      const updated = db.scene.update({
        where,
        data: {
          ...(typeof title === "string" ? { title } : {}),
          ...(items ? { items } : {}),
          ...(itemOrder ? { itemOrder: JSON.stringify(itemOrder) } : {}),
          ...(typeof archived === "boolean" ? { archived } : {}),
          modifiedDate: new Date().toISOString(),
        },
      });
      if (!updated) throw new Error("scene vanished mid-update");
      return HttpResponse.json(toScene(updated));
    },
  ),
  http.delete<{ key: string }, null, ErrorResponseBody | null>(
    urls.scenes.detail,
    ({ params }) => {
      // As the real API: authentication, then existence, then ownership.
      const user = getUser();
      if (!user) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }
      const where = { key: { equals: params.key } };
      const scene = db.scene.findFirst({ where });
      if (!scene) {
        return HttpResponse.json({ detail: "Not Found" }, { status: 404 });
      }
      if (scene.author !== user.id) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }
      db.scene.delete({ where });
      return new HttpResponse(null, { status: 204 });
    },
  ),
  // allauth sign-out. Its 401 confirms the session is gone; `useLogout` treats
  // it as success.
  http.delete(urls.auth.session, async () => {
    currentUserId = null;
    return HttpResponse.json({ status: 401 }, { status: 401 });
  }),
  // v1: delete own account (204 No Content; signs the user out)
  http.delete(urls.auth.usersMe, async () => {
    if (!getUser()) {
      return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
    }
    currentUserId = null;
    return new HttpResponse(null, { status: 204 });
  }),
  // v1: users/me GET. `get_me` gates by hand (`auth=None`, `403: None`) so the
  // CSRF cookie is seeded before the gate — which also means the anonymous 403
  // never reaches main/api.py's AuthenticationError handler and so carries no
  // body. Content-Length is spelled out to match Django's CommonMiddleware:
  // openapi-fetch keys on it to yield `error: undefined` (without it, `""`),
  // the shape useUserMe must survive.
  http.get<NoParams, ErrorResponseBody | User>(urls.auth.usersMe, async () => {
    const user = getUser();
    if (!user) {
      return new HttpResponse(null, {
        status: 403,
        headers: {
          "content-length": "0",
          "content-type": "application/json",
        },
      });
    }
    return HttpResponse.json(
      {
        id: user.id,
        email: user.email,
      },
      { status: 200 },
    );
  }),
];
