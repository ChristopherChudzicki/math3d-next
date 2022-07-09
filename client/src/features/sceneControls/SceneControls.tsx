import { getScene } from "api";
import { MathItemType } from "configs";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assertIsMathItemType } from "util/predicates";

import AddObjectButton from "./AddObjectButton";
import ControlTabs from "./controlTabs";
import {
  FolderWithContents,
  mathItemsSlice,
  selectMathItems,
} from "./mathItems";
import { selectSubtree } from "./mathItems/itemOrder.slice";

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
  const { children = [] } = useAppSelector(selectSubtree(rootId));
  const mathItems = useAppSelector(selectMathItems());
  return (
    <>
      {children.map((folder) => {
        const childItems =
          folder.children?.map(({ id }) => mathItems[id]) ?? [];
        const folderItem = mathItems[folder.id];
        assertIsMathItemType(folderItem.type, MathItemType.Folder);
        return (
          <FolderWithContents
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

  useEffect(() => {
    const loadScene = async (id: string) => {
      const scene = await getScene(id);
      dispatch(itemActions.addItems({ items: scene.items }));
    };
    if (sceneId) {
      loadScene(sceneId);
    }
  }, [dispatch, sceneId]);
  return (
    <ControlTabs
      tabBarExtraContent={<AddObjectButton />}
      mainNav={<MainNav />}
      mainContent={<MathItemsList rootId="main" />}
      axesNav={<AxesNav />}
      axesdContent={<MathItemsList rootId="setup" />}
    />
  );
};

export default SceneControls;
