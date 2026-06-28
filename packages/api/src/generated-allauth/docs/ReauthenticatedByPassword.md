# ReauthenticatedByPassword

## Properties

| Name                | Type        | Description                                                                          | Notes                  |
| ------------------- | ----------- | ------------------------------------------------------------------------------------ | ---------------------- |
| **at**              | **number**  | An epoch based timestamp (trivial to parse using: &#x60;new Date(value)\*1000&#x60;) | [default to undefined] |
| **method**          | **string**  |                                                                                      | [default to undefined] |
| **reauthenticated** | **boolean** |                                                                                      | [default to undefined] |

## Example

```typescript
import { ReauthenticatedByPassword } from "./api";

const instance: ReauthenticatedByPassword = {
  at,
  method,
  reauthenticated,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
