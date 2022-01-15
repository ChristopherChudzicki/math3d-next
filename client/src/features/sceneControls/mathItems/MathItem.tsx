import React from "react";
import { useAppSelector, useAppDispatch } from "app/hooks";
import mathItemStore, { selectMathItem } from "./mathItems.slice";

const { actions } = mathItemStore;

type Props = {
  id: string;
};
const MathItem: React.FC<Props> = ({ id }) => {
  const mathItem = useAppSelector(selectMathItem(id));
  const dispatch = useAppDispatch();
  return (
    <div>
      <input
        type="text"
        value={mathItem.properties.description}
        onChange={(e) => {
          const properties = {
            description: e.target.value,
          };
          dispatch(actions.setProperties({ id, properties }));
        }}
      />
    </div>
  );
};

export default MathItem;
