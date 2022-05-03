import React, { useCallback } from "react";
import { Menu, Dropdown, Button, MenuProps } from "antd";
import { MathItemType as MIT } from "types";
import { useAppDispatch } from "app/hooks";
import { assertIsMathItemType } from "util/predicates";
import { slice, configs, AddableTypes } from "./mathItems";

const { actions } = slice;

type Props = {
  className?: string;
};

// change this to MIT[] when all items are configured
const addableTypes: AddableTypes[] = [MIT.Point, MIT.Variable];

type MenuClickHandler = NonNullable<MenuProps["onClick"]>;

const AddObjectButton: React.FC<Props> = (props) => {
  const dispatch = useAppDispatch();
  const handleClick: MenuClickHandler = useCallback(
    ({ key }) => {
      assertIsMathItemType<AddableTypes>(key);
      dispatch(actions.addNewItem({ type: key }));
    },
    [dispatch]
  );
  return (
    <Dropdown
      overlay={
        <Menu
          onClick={handleClick}
          items={addableTypes.map((type) => ({
            label: configs[type].label,
            key: type,
          }))}
        />
      }
      trigger={["click"]}
      className={props.className}
    >
      <Button>Add New Object</Button>
    </Dropdown>
  );
};

export default AddObjectButton;
