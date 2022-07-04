import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState, SelectorReturn } from "store/store";
import { assertNotNil } from "util/predicates";
import { MathItemType } from "configs";
import { actions as mathItemActions } from "./mathItems.slice";

import defaultScene from "../defaultScene";

export interface SortableTreeState {
  [id: string]: string[];
}

const getInitialState = (): SortableTreeState => defaultScene.sortableTree;

const MAIN_FOLDER = "main";

const sortableTreeSlice = createSlice({
  name: "sortableTree",
  initialState: getInitialState,
  reducers: {
    addNodes: (state, action: PayloadAction<{ nodes: SortableTreeState }>) => {
      return { ...state, ...action.payload.nodes };
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(mathItemActions.addNewItem, (state, action) => {
        const { id, type } = action.payload;
        const isFolder = type === MathItemType.Folder;
        const targetFolderId = isFolder
          ? MAIN_FOLDER
          : state[MAIN_FOLDER].at(-1);
        assertNotNil(targetFolderId);
        state[targetFolderId].push(id);
        if (isFolder) {
          state[id] = [];
        }
      })
      .addCase(mathItemActions.remove, (state, action) => {
        const { id } = action.payload;
        const parentFolderId = Object.keys(state).find((folderId) => {
          return state[folderId].includes(id);
        });
        assertNotNil(parentFolderId);
        state[parentFolderId] = state[parentFolderId].filter(
          (itemId) => itemId !== id
        );
      }),
});

interface Subtree {
  id: string;
  children?: Subtree[];
}

const getSubtree = (
  state: SortableTreeState,
  node: Subtree,
  depth = 0
): Subtree => {
  if (node.children) return node;
  if (!state[node.id]) return node;
  if (depth > 2) {
    /**
     * Sanity check. Math3d UI does not support nesting folders.
     * Max depth should be 2:
     * root
     *    userFolder1
     *      item1a
     *      item1b
     *    userFolder2
     *      ...etc
     */
    throw new Error("Depth should not be greater than 2.");
  }
  const children = state[node.id].map((id) => {
    return getSubtree(state, { id }, depth + 1);
  });
  return { ...node, children };
};

export const selectSubtree =
  (rootId: string): SelectorReturn<Subtree> =>
  (state: RootState) =>
    getSubtree(state.sortableTree, { id: rootId });

export const { actions, reducer } = sortableTreeSlice;
export default sortableTreeSlice;
