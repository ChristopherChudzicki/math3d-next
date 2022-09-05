import { Button, Dropdown, Menu, MenuProps } from "antd";
import { addableTypes, mathItemConfigs, MathItemType } from "@/configs";
import React, { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { assertIsMathItemType } from "@/util/predicates";
import idGenerator from "@/util/idGenerator";

import { mathItemsSlice } from "./mathItems";

const { actions } = mathItemsSlice;

type Props = {
  className?: string;
};

type MenuClickHandler = NonNullable<MenuProps["onClick"]>;

const AddObjectButton: React.FC<Props> = (props) => {
  const dispatch = useAppDispatch();
  const handleClick: MenuClickHandler = useCallback(
    ({ key }) => {
      assertIsMathItemType<MathItemType>(key);
      dispatch(actions.addNewItem({ type: key, id: idGenerator.next() }));
    },
    [dispatch]
  );
  return (
    <Dropdown
      overlay={
        <Menu
          onClick={handleClick}
          items={addableTypes.map((type) => ({
            label: mathItemConfigs[type].label,
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
