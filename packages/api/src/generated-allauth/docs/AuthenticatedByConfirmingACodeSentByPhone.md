# AuthenticatedByConfirmingACodeSentByPhone

## Properties

| Name       | Type       | Description                                                                          | Notes                  |
| ---------- | ---------- | ------------------------------------------------------------------------------------ | ---------------------- |
| **at**     | **number** | An epoch based timestamp (trivial to parse using: &#x60;new Date(value)\*1000&#x60;) | [default to undefined] |
| **method** | **string** |                                                                                      | [default to undefined] |
| **phone**  | **string** | The phone number.                                                                    | [default to undefined] |

## Example

```typescript
import { AuthenticatedByConfirmingACodeSentByPhone } from "./api";

const instance: AuthenticatedByConfirmingACodeSentByPhone = {
  at,
  method,
  phone,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
