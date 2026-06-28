# ChangePasswordRequest

## Properties

| Name                 | Type       | Description           | Notes                             |
| -------------------- | ---------- | --------------------- | --------------------------------- |
| **current_password** | **string** | The password.         | [optional] [default to undefined] |
| **new_password**     | **string** | The current password. | [default to undefined]            |

## Example

```typescript
import { ChangePasswordRequest } from "./api";

const instance: ChangePasswordRequest = {
  current_password,
  new_password,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
