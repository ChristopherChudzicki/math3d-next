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

  const { isLoading, data: scene } = useScene(sceneId);

  useEffect(() => {
    if (!scene) return;
    const payload = { items: scene.items, order: scene.itemOrder };
    dispatch(itemActions.setItems(payload));
  }, [dispatch, scene, sceneId]);

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
