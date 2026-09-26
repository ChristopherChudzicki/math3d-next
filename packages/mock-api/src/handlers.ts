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
    usersMeDelete: `${BASE_URL}/v1/auth/users/me/delete/`,
    // allauth headless endpoints
    session: `${BASE_URL}/_allauth/browser/v1/auth/session`,
  },
} as const;

export const handlers = [
  // v1: my scenes. The anonymous response is a 403, not Ninja's default 401:
  // main/api.py remaps AuthenticationError because session auth cannot send a
  // compliant WWW-Authenticate challenge.
  http.get<NoParams, ErrorResponseBody | PagedMiniSceneSchema>(
    urls.scenes.meList,
    async () => {
      const user = getUser();
      if (!user) {
        return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
      }

      const scenes = db.scene.findMany({
        where: {
          author: {
            equals: user.id,
          },
        },
      });
      const items = scenes.map((s) => ({
        title: s.title,
        key: s.key,
        author: s.author,
        archived: s.archived,
        createdDate: s.createdDate,
        modifiedDate: s.modifiedDate,
      }));
      return HttpResponse.json({
        count: items.length,
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
      const parsedScene = {
        ...scene,
        itemOrder: JSON.parse(scene.itemOrder),
      };
      return HttpResponse.json(parsedScene);
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
      const sceneRecord = db.scene.create({
        title,
        items,
        itemOrder: JSON.stringify(itemOrder),
      });
      const scene: Scene = {
        ...sceneRecord,
        itemOrder: JSON.parse(sceneRecord.itemOrder),
      };
      return HttpResponse.json(scene, { status: 201 });
    },
  ),
  // allauth sign-out. Its 401 confirms the session is gone; `useLogout` treats
  // it as success.
  http.delete(urls.auth.session, async () => {
    currentUserId = null;
    return HttpResponse.json({ status: 401 }, { status: 401 });
  }),
  // v1: delete own account (204 No Content; signs the user out)
  http.post(urls.auth.usersMeDelete, async () => {
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
