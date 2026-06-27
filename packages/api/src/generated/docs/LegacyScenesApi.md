# LegacyScenesApi

All URIs are relative to _http://localhost_

| Method                                            | HTTP request                     | Description |
| ------------------------------------------------- | -------------------------------- | ----------- |
| [**legacyScenesCreate**](#legacyscenescreate)     | **POST** /v0/legacy_scenes/      |             |
| [**legacyScenesList**](#legacysceneslist)         | **GET** /v0/legacy_scenes/       |             |
| [**legacyScenesRetrieve**](#legacyscenesretrieve) | **GET** /v0/legacy_scenes/{key}/ |             |

# **legacyScenesCreate**

> LegacyScene legacyScenesCreate(LegacySceneRequest)

### Example

```typescript
import { LegacyScenesApi, Configuration, LegacySceneRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new LegacyScenesApi(configuration);

let LegacySceneRequest: LegacySceneRequest; //

const { status, data } =
  await apiInstance.legacyScenesCreate(LegacySceneRequest);
```

### Parameters

| Name                   | Type                   | Description | Notes |
| ---------------------- | ---------------------- | ----------- | ----- |
| **LegacySceneRequest** | **LegacySceneRequest** |             |       |

### Return type

**LegacyScene**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: application/json, application/x-www-form-urlencoded, multipart/form-data
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **legacyScenesList**

> PaginatedLegacySceneList legacyScenesList()

### Example

```typescript
import { LegacyScenesApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new LegacyScenesApi(configuration);

let limit: number; //Number of results to return per page. (optional) (default to undefined)
let offset: number; //The initial index from which to return the results. (optional) (default to undefined)

const { status, data } = await apiInstance.legacyScenesList(limit, offset);
```

### Parameters

| Name       | Type         | Description                                         | Notes                            |
| ---------- | ------------ | --------------------------------------------------- | -------------------------------- |
| **limit**  | [**number**] | Number of results to return per page.               | (optional) defaults to undefined |
| **offset** | [**number**] | The initial index from which to return the results. | (optional) defaults to undefined |

### Return type

**PaginatedLegacySceneList**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **legacyScenesRetrieve**

> LegacyScene legacyScenesRetrieve()

### Example

```typescript
import { LegacyScenesApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new LegacyScenesApi(configuration);

let key: string; // (default to undefined)

const { status, data } = await apiInstance.legacyScenesRetrieve(key);
```

### Parameters

| Name    | Type         | Description | Notes                 |
| ------- | ------------ | ----------- | --------------------- |
| **key** | [**string**] |             | defaults to undefined |

### Return type

**LegacyScene**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
