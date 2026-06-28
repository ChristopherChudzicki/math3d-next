# AuthenticatedByThirdPartyProvider

## Properties

| Name         | Type       | Description                                                                          | Notes                  |
| ------------ | ---------- | ------------------------------------------------------------------------------------ | ---------------------- |
| **at**       | **number** | An epoch based timestamp (trivial to parse using: &#x60;new Date(value)\*1000&#x60;) | [default to undefined] |
| **method**   | **string** |                                                                                      | [default to undefined] |
| **provider** | **string** | The provider ID.                                                                     | [default to undefined] |
| **uid**      | **string** | The provider specific account ID.                                                    | [default to undefined] |

## Example

```typescript
import { AuthenticatedByThirdPartyProvider } from "./api";

const instance: AuthenticatedByThirdPartyProvider = {
  at,
  method,
  provider,
  uid,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
