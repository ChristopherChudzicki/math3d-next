import React from "react";
import { useAppSelector, useAppDispatch } from "app/hooks";
import mathObjStore, { selectMathObject } from "./mathObjects.slice";
import idGenerator from "util/idGenerator";

const { actions } = mathObjStore;

type Props = {
  id: string;
};
const MathObject: React.FC<Props> = ({ id }) => {
  const mathObj = useAppSelector(selectMathObject(id));
  const dispatch = useAppDispatch();
  return (
    <div>
      <input
        type="text"
        value={mathObj.properties.description}
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

export default MathObject;
