# ScenesApi

All URIs are relative to _http://localhost_

| Method                                          | HTTP request                 | Description |
| ----------------------------------------------- | ---------------------------- | ----------- |
| [**scenesCreate**](#scenescreate)               | **POST** /v0/scenes/         |             |
| [**scenesDestroy**](#scenesdestroy)             | **DELETE** /v0/scenes/{key}/ |             |
| [**scenesList**](#sceneslist)                   | **GET** /v0/scenes/          |             |
| [**scenesMeList**](#scenesmelist)               | **GET** /v0/scenes/me/       |             |
| [**scenesPartialUpdate**](#scenespartialupdate) | **PATCH** /v0/scenes/{key}/  |             |
| [**scenesRetrieve**](#scenesretrieve)           | **GET** /v0/scenes/{key}/    |             |

# **scenesCreate**

> SceneCreate scenesCreate(SceneCreateRequest)

### Example

```typescript
import { ScenesApi, Configuration, SceneCreateRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new ScenesApi(configuration);

let SceneCreateRequest: SceneCreateRequest; //

const { status, data } = await apiInstance.scenesCreate(SceneCreateRequest);
```

### Parameters

| Name                   | Type                   | Description | Notes |
| ---------------------- | ---------------------- | ----------- | ----- |
| **SceneCreateRequest** | **SceneCreateRequest** |             |       |

### Return type

**SceneCreate**

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

# **scenesDestroy**

> scenesDestroy()

### Example

```typescript
import { ScenesApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new ScenesApi(configuration);

let key: string; // (default to undefined)

const { status, data } = await apiInstance.scenesDestroy(key);
```

### Parameters

| Name    | Type         | Description | Notes                 |
| ------- | ------------ | ----------- | --------------------- |
| **key** | [**string**] |             | defaults to undefined |

### Return type

void (empty response body)

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesList**

> PaginatedMiniSceneList scenesList()

### Example

```typescript
import { ScenesApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new ScenesApi(configuration);

let archived: boolean; // (optional) (default to undefined)
let limit: number; //Number of results to return per page. (optional) (default to undefined)
let offset: number; //The initial index from which to return the results. (optional) (default to undefined)
let title: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.scenesList(
  archived,
  limit,
  offset,
  title,
);
```

### Parameters

| Name         | Type          | Description                                         | Notes                            |
| ------------ | ------------- | --------------------------------------------------- | -------------------------------- |
| **archived** | [**boolean**] |                                                     | (optional) defaults to undefined |
| **limit**    | [**number**]  | Number of results to return per page.               | (optional) defaults to undefined |
| **offset**   | [**number**]  | The initial index from which to return the results. | (optional) defaults to undefined |
| **title**    | [**string**]  |                                                     | (optional) defaults to undefined |

### Return type

**PaginatedMiniSceneList**

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

# **scenesMeList**

> PaginatedMiniSceneList scenesMeList()

### Example

```typescript
import { ScenesApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new ScenesApi(configuration);

let archived: boolean; // (optional) (default to undefined)
let limit: number; //Number of results to return per page. (optional) (default to undefined)
let offset: number; //The initial index from which to return the results. (optional) (default to undefined)
let title: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.scenesMeList(
  archived,
  limit,
  offset,
  title,
);
```

### Parameters

| Name         | Type          | Description                                         | Notes                            |
| ------------ | ------------- | --------------------------------------------------- | -------------------------------- |
| **archived** | [**boolean**] |                                                     | (optional) defaults to undefined |
| **limit**    | [**number**]  | Number of results to return per page.               | (optional) defaults to undefined |
| **offset**   | [**number**]  | The initial index from which to return the results. | (optional) defaults to undefined |
| **title**    | [**string**]  |                                                     | (optional) defaults to undefined |

### Return type

**PaginatedMiniSceneList**

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

# **scenesPartialUpdate**

> Scene scenesPartialUpdate()

### Example

```typescript
import { ScenesApi, Configuration, PatchedSceneRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new ScenesApi(configuration);

let key: string; // (default to undefined)
let PatchedSceneRequest: PatchedSceneRequest; // (optional)

const { status, data } = await apiInstance.scenesPartialUpdate(
  key,
  PatchedSceneRequest,
);
```

### Parameters

| Name                    | Type                    | Description | Notes                 |
| ----------------------- | ----------------------- | ----------- | --------------------- |
| **PatchedSceneRequest** | **PatchedSceneRequest** |             |                       |
| **key**                 | [**string**]            |             | defaults to undefined |

### Return type

**Scene**

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: application/json, application/x-www-form-urlencoded, multipart/form-data
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesRetrieve**

> Scene scenesRetrieve()

### Example

```typescript
import { ScenesApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new ScenesApi(configuration);

let key: string; // (default to undefined)

const { status, data } = await apiInstance.scenesRetrieve(key);
```

### Parameters

| Name    | Type         | Description | Notes                 |
| ------- | ------------ | ----------- | --------------------- |
| **key** | [**string**] |             | defaults to undefined |

### Return type

**Scene**

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
