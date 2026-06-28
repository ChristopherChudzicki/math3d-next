# User

## Properties

| Name                    | Type        | Description                                    | Notes                             |
| ----------------------- | ----------- | ---------------------------------------------- | --------------------------------- |
| **display**             | **string**  | The display name for the user.                 | [default to undefined]            |
| **email**               | **string**  | The email address.                             | [optional] [default to undefined] |
| **has_usable_password** | **boolean** | Whether or not the account has a password set. | [default to undefined]            |
| **id**                  | **number**  | The user ID.                                   | [optional] [default to undefined] |

## Example

```typescript
import { User } from "./api";

const instance: User = {
  display,
  email,
  has_usable_password,
  id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
