# AuthenticationMethod

## Properties

| Name                | Type                                          | Description                                                                          | Notes                             |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| **at**              | **number**                                    | An epoch based timestamp (trivial to parse using: &#x60;new Date(value)\*1000&#x60;) | [default to undefined]            |
| **email**           | **string**                                    | The email address.                                                                   | [default to undefined]            |
| **method**          | **string**                                    |                                                                                      | [default to undefined]            |
| **username**        | **string**                                    | The username.                                                                        | [optional] [default to undefined] |
| **phone**           | **string**                                    | The phone number.                                                                    | [default to undefined]            |
| **reauthenticated** | **boolean**                                   |                                                                                      | [default to undefined]            |
| **provider**        | **string**                                    | The provider ID.                                                                     | [default to undefined]            |
| **uid**             | **string**                                    | The provider specific account ID.                                                    | [default to undefined]            |
| **type**            | [**AuthenticatorType**](AuthenticatorType.md) |                                                                                      | [default to undefined]            |

## Example

```typescript
import { AuthenticationMethod } from "./api";

const instance: AuthenticationMethod = {
  at,
  email,
  method,
  username,
  phone,
  reauthenticated,
  provider,
  uid,
  type,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
