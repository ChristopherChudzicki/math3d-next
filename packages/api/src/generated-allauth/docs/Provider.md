# Provider

## Properties

| Name                         | Type                    | Description                                                                                | Notes                             |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| **client_id**                | **string**              | The client ID (in case of OAuth2 or OpenID Connect based providers)                        | [optional] [default to undefined] |
| **flows**                    | **Array&lt;string&gt;** | The authentication flows the provider integration supports.                                | [default to undefined]            |
| **id**                       | **string**              | The provider ID.                                                                           | [default to undefined]            |
| **name**                     | **string**              | The name of the provider.                                                                  | [default to undefined]            |
| **openid_configuration_url** | **string**              | The OIDC discovery or well-known URL (in case of OAuth2 or OpenID Connect based providers) | [optional] [default to undefined] |

## Example

```typescript
import { Provider } from "./api";

const instance: Provider = {
  client_id,
  flows,
  id,
  name,
  openid_configuration_url,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
