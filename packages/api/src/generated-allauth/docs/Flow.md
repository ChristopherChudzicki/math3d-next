# Flow

## Properties

| Name           | Type                                                       | Description                                       | Notes                             |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------- | --------------------------------- |
| **id**         | **string**                                                 |                                                   | [default to undefined]            |
| **is_pending** | **boolean**                                                |                                                   | [optional] [default to undefined] |
| **provider**   | [**Provider**](Provider.md)                                |                                                   | [optional] [default to undefined] |
| **types**      | [**Array&lt;AuthenticatorType&gt;**](AuthenticatorType.md) | Matches &#x60;settings.MFA_SUPPORTED_TYPES&#x60;. | [optional] [default to undefined] |

## Example

```typescript
import { Flow } from "./api";

const instance: Flow = {
  id,
  is_pending,
  provider,
  types,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
