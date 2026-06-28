# Authenticated

## Properties

| Name        | Type                                                             | Description                             | Notes                  |
| ----------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------- |
| **methods** | [**Array&lt;AuthenticationMethod&gt;**](AuthenticationMethod.md) | A list of methods used to authenticate. | [default to undefined] |
| **user**    | [**User**](User.md)                                              |                                         | [default to undefined] |

## Example

```typescript
import { Authenticated } from "./api";

const instance: Authenticated = {
  methods,
  user,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
