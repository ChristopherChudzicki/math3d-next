# AuthenticationMeta

## Properties

| Name                 | Type        | Description                                       | Notes                             |
| -------------------- | ----------- | ------------------------------------------------- | --------------------------------- |
| **access_token**     | **string**  | The access token (&#x60;app&#x60; clients only).  | [optional] [default to undefined] |
| **session_token**    | **string**  | The session token (&#x60;app&#x60; clients only). | [optional] [default to undefined] |
| **is_authenticated** | **boolean** |                                                   | [default to undefined]            |

## Example

```typescript
import { AuthenticationMeta } from "./api";

const instance: AuthenticationMeta = {
  access_token,
  session_token,
  is_authenticated,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
