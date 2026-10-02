import { addableTypes, mathItemConfigs } from "@math3d/mathitem-configs";
import React from "react";
import { useAppDispatch } from "@/store/hooks";
import { Menu } from "@/ui/Menu";
import { sceneSlice } from "./mathItems";
import styles from "./AddObjectButton.module.css";

const { actions } = sceneSlice;

type Props = {
  className?: string;
};

const AddObjectButton: React.FC<Props> = (props) => {
  const dispatch = useAppDispatch();

  return (
    <div className={props.className}>
      <Menu.Root>
        <Menu.Trigger className={styles.trigger}>Add Object</Menu.Trigger>
        <Menu.Popup align="start">
          {addableTypes.map((type) => (
            <Menu.Item
              key={type}
              onClick={() => dispatch(actions.addNewItem({ type }))}
            >
              {mathItemConfigs[type].label}
            </Menu.Item>
          ))}
        </Menu.Popup>
      </Menu.Root>
    </div>
  );
};

export default AddObjectButton;
