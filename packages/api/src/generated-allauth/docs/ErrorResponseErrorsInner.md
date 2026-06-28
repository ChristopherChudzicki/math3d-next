# ErrorResponseErrorsInner

## Properties

| Name        | Type       | Description                                         | Notes                             |
| ----------- | ---------- | --------------------------------------------------- | --------------------------------- |
| **code**    | **string** | An error code.                                      | [default to undefined]            |
| **message** | **string** | A human readable error message.                     | [default to undefined]            |
| **param**   | **string** | The name of the input parameter that was incorrect. | [optional] [default to undefined] |

## Example

```typescript
import { ErrorResponseErrorsInner } from "./api";

const instance: ErrorResponseErrorsInner = {
  code,
  message,
  param,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
