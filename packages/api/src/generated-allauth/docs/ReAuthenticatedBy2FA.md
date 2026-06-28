# ReAuthenticatedBy2FA

## Properties

| Name                | Type                                          | Description                                                                          | Notes                             |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| **at**              | **number**                                    | An epoch based timestamp (trivial to parse using: &#x60;new Date(value)\*1000&#x60;) | [default to undefined]            |
| **method**          | **string**                                    |                                                                                      | [default to undefined]            |
| **reauthenticated** | **boolean**                                   |                                                                                      | [optional] [default to undefined] |
| **type**            | [**AuthenticatorType**](AuthenticatorType.md) |                                                                                      | [default to undefined]            |

## Example

```typescript
import { ReAuthenticatedBy2FA } from "./api";

const instance: ReAuthenticatedBy2FA = {
  at,
  method,
  reauthenticated,
  type,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
