# SceneSchema

## Properties

| Name             | Type                                        | Description | Notes                             |
| ---------------- | ------------------------------------------- | ----------- | --------------------------------- |
| **archived**     | **boolean**                                 |             | [default to undefined]            |
| **author**       | **number**                                  |             | [optional] [default to undefined] |
| **createdDate**  | **string**                                  |             | [default to undefined]            |
| **isLegacy**     | **boolean**                                 |             | [default to undefined]            |
| **itemOrder**    | **{ [key: string]: Array&lt;string&gt;; }** |             | [default to undefined]            |
| **items**        | [**Array&lt;MathItem&gt;**](MathItem.md)    |             | [default to undefined]            |
| **key**          | **string**                                  |             | [default to undefined]            |
| **modifiedDate** | **string**                                  |             | [default to undefined]            |
| **title**        | **string**                                  |             | [optional] [default to undefined] |

## Example

```typescript
import { SceneSchema } from "./api";

const instance: SceneSchema = {
  archived,
  author,
  createdDate,
  isLegacy,
  itemOrder,
  items,
  key,
  modifiedDate,
  title,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
