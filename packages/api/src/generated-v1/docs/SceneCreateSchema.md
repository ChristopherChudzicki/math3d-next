# SceneCreateSchema

## Properties

| Name          | Type                                        | Description | Notes                             |
| ------------- | ------------------------------------------- | ----------- | --------------------------------- |
| **archived**  | **boolean**                                 |             | [optional] [default to false]     |
| **itemOrder** | **{ [key: string]: Array&lt;string&gt;; }** |             | [default to undefined]            |
| **items**     | [**Array&lt;MathItem&gt;**](MathItem.md)    |             | [default to undefined]            |
| **title**     | **string**                                  |             | [optional] [default to undefined] |

## Example

```typescript
import { SceneCreateSchema } from "./api";

const instance: SceneCreateSchema = {
  archived,
  itemOrder,
  items,
  title,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
