# ScenePatchSchema

## Properties

| Name          | Type                                        | Description | Notes                             |
| ------------- | ------------------------------------------- | ----------- | --------------------------------- |
| **archived**  | **boolean**                                 |             | [optional] [default to undefined] |
| **itemOrder** | **{ [key: string]: Array&lt;string&gt;; }** |             | [optional] [default to undefined] |
| **items**     | [**Array&lt;MathItem&gt;**](MathItem.md)    |             | [optional] [default to undefined] |
| **title**     | **string**                                  |             | [optional] [default to undefined] |

## Example

```typescript
import { ScenePatchSchema } from "./api";

const instance: ScenePatchSchema = {
  archived,
  itemOrder,
  items,
  title,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
