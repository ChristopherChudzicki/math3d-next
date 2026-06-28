# BaseAuthenticationMeta

## Properties

| Name              | Type       | Description                                       | Notes                             |
| ----------------- | ---------- | ------------------------------------------------- | --------------------------------- |
| **access_token**  | **string** | The access token (&#x60;app&#x60; clients only).  | [optional] [default to undefined] |
| **session_token** | **string** | The session token (&#x60;app&#x60; clients only). | [optional] [default to undefined] |

## Example

```typescript
import { BaseAuthenticationMeta } from "./api";

const instance: BaseAuthenticationMeta = {
  access_token,
  session_token,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
