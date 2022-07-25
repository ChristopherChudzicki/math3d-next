import { useScene } from "api/scene";
import classNames from "classnames";
import { MathItemType } from "configs";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assertIsMathItemType } from "util/predicates";

import AddObjectButton from "./AddObjectButton";
import ControlTabs from "./controlTabs";
import {
  FolderWithContents,
  mathItemsSlice,
  select,
  actions,
} from "./mathItems";
import style from "./SceneControls.module.css";

const { actions: itemActions } = mathItemsSlice;

type Props = {
  sceneId?: string;
};

const MainNav: React.FC = () => <>Main</>;

const AxesNav: React.FC = () => (
  <div className="text-center">
    Axes &amp; <br /> Camera
  </div>
);

const MathItemsList: React.FC<{ rootId: string }> = ({ rootId }) => {
  const { children = [] } = useAppSelector(select.subtree(rootId));
  const mathItems = useAppSelector(select.mathItems());
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(actions.initializeMathScope());
  }, [dispatch]);
  return (
    <>
      {children.map((folder, folderIndex) => {
        const childItems =
          folder.children?.map(({ id }) => mathItems[id]) ?? [];
        const folderItem = mathItems[folder.id];
        assertIsMathItemType(folderItem.type, MathItemType.Folder);
        return (
          <FolderWithContents
            contentsClassName={classNames({
              [style["last-folder"]]: folderIndex === children.length - 1,
            })}
            key={folderItem.id}
            folder={folderItem}
            items={childItems}
          />
        );
      })}
    </>
  );
};

const SceneControls: React.FC<Props> = (props) => {
  const { sceneId } = props;
  const dispatch = useAppDispatch();

  /**
   * TODO: Remove this check after updating tests to use msw
   */
  const items = useAppSelector(select.mathItems());
  const hasItems = Object.keys(items).length > 0;

  const { isLoading, data: scene } = useScene(sceneId);

  useEffect(() => {
    /**
     * Old integration tests directly patch the store.
     * If the store already has items, don't update.
     * Temporary until I change all the tests.
     */
    if (hasItems) return;
    if (!scene) return;
    const payload = { items: scene.items, order: scene.itemOrder };
    dispatch(itemActions.setItems(payload));
  }, [dispatch, scene, sceneId, hasItems]);

  return (
    <ControlTabs
      loading={isLoading}
      tabBarExtraContent={<AddObjectButton />}
      mainNav={<MainNav />}
      mainContent={<MathItemsList rootId="main" />}
      axesNav={<AxesNav />}
      axesdContent={<MathItemsList rootId="setup" />}
    />
  );
};

export default SceneControls;
