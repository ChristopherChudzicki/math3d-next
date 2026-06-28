# AuthenticatedByUsernameEmailLogin

## Properties

| Name         | Type       | Description                                                                          | Notes                             |
| ------------ | ---------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| **at**       | **number** | An epoch based timestamp (trivial to parse using: &#x60;new Date(value)\*1000&#x60;) | [default to undefined]            |
| **email**    | **string** | The email address.                                                                   | [optional] [default to undefined] |
| **method**   | **string** |                                                                                      | [default to undefined]            |
| **username** | **string** | The username.                                                                        | [optional] [default to undefined] |

## Example

```typescript
import { AuthenticatedByUsernameEmailLogin } from "./api";

const instance: AuthenticatedByUsernameEmailLogin = {
  at,
  email,
  method,
  username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
