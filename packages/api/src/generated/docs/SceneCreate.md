# SceneCreate

## Properties

| Name             | Type        | Description | Notes                             |
| ---------------- | ----------- | ----------- | --------------------------------- |
| **items**        | **any**     |             | [default to undefined]            |
| **itemOrder**    | **any**     |             | [default to undefined]            |
| **title**        | **string**  |             | [optional] [default to undefined] |
| **key**          | **string**  |             | [readonly] [default to undefined] |
| **createdDate**  | **string**  |             | [readonly] [default to undefined] |
| **modifiedDate** | **string**  |             | [readonly] [default to undefined] |
| **archived**     | **boolean** |             | [optional] [default to undefined] |
| **isLegacy**     | **boolean** |             | [readonly] [default to undefined] |

## Example

```typescript
import { SceneCreate } from "./api";

const instance: SceneCreate = {
  items,
  itemOrder,
  title,
  key,
  createdDate,
  modifiedDate,
  archived,
  isLegacy,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
