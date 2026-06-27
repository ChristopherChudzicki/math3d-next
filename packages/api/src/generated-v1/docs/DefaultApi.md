# DefaultApi

All URIs are relative to _http://localhost_

| Method                                                      | HTTP request                        | Description   |
| ----------------------------------------------------------- | ----------------------------------- | ------------- |
| [**authenticationApiActivate**](#authenticationapiactivate) | **POST** /v1/auth/users/activation/ | Activate      |
| [**authenticationApiDeleteMe**](#authenticationapideleteme) | **POST** /v1/auth/users/me/delete/  | Delete Me     |
| [**authenticationApiGetMe**](#authenticationapigetme)       | **GET** /v1/auth/users/me/          | Get Me        |
| [**authenticationApiPatchMe**](#authenticationapipatchme)   | **PATCH** /v1/auth/users/me/        | Patch Me      |
| [**scenesApiCreateLegacy**](#scenesapicreatelegacy)         | **POST** /v1/legacy_scenes/         | Create Legacy |
| [**scenesApiCreateScene**](#scenesapicreatescene)           | **POST** /v1/scenes/                | Create Scene  |
| [**scenesApiDeleteScene**](#scenesapideletescene)           | **DELETE** /v1/scenes/{key}/        | Delete Scene  |
| [**scenesApiGetLegacy**](#scenesapigetlegacy)               | **GET** /v1/legacy_scenes/{key}/    | Get Legacy    |
| [**scenesApiGetScene**](#scenesapigetscene)                 | **GET** /v1/scenes/{key}/           | Get Scene     |
| [**scenesApiListScenes**](#scenesapilistscenes)             | **GET** /v1/scenes/                 | List Scenes   |
| [**scenesApiMyScenes**](#scenesapimyscenes)                 | **GET** /v1/scenes/me/              | My Scenes     |
| [**scenesApiUpdateScene**](#scenesapiupdatescene)           | **PATCH** /v1/scenes/{key}/         | Update Scene  |

# **authenticationApiActivate**

> authenticationApiActivate(ActivationSchema)

### Example

```typescript
import { DefaultApi, Configuration, ActivationSchema } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let ActivationSchema: ActivationSchema; //

const { status, data } =
  await apiInstance.authenticationApiActivate(ActivationSchema);
```

### Parameters

| Name                 | Type                 | Description | Notes |
| -------------------- | -------------------- | ----------- | ----- |
| **ActivationSchema** | **ActivationSchema** |             |       |

### Return type

void (empty response body)

### Authorization

[StaffSessionAuth](../README.md#StaffSessionAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **204**     | No Content  | -                |
| **404**     | Not Found   | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authenticationApiDeleteMe**

> authenticationApiDeleteMe(DeleteAccountSchema)

### Example

```typescript
import { DefaultApi, Configuration, DeleteAccountSchema } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let DeleteAccountSchema: DeleteAccountSchema; //

const { status, data } =
  await apiInstance.authenticationApiDeleteMe(DeleteAccountSchema);
```

### Parameters

| Name                    | Type                    | Description | Notes |
| ----------------------- | ----------------------- | ----------- | ----- |
| **DeleteAccountSchema** | **DeleteAccountSchema** |             |       |

### Return type

void (empty response body)

### Authorization

[SessionAuth](../README.md#SessionAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **204**     | No Content  | -                |
| **400**     | Bad Request | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authenticationApiGetMe**

> UserSchema authenticationApiGetMe()

### Example

```typescript
import { DefaultApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.authenticationApiGetMe();
```

### Parameters

This endpoint does not have any parameters.

### Return type

**UserSchema**

### Authorization

[SessionAuth](../README.md#SessionAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authenticationApiPatchMe**

> UserSchema authenticationApiPatchMe(UserUpdateSchema)

### Example

```typescript
import { DefaultApi, Configuration, UserUpdateSchema } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let UserUpdateSchema: UserUpdateSchema; //

const { status, data } =
  await apiInstance.authenticationApiPatchMe(UserUpdateSchema);
```

### Parameters

| Name                 | Type                 | Description | Notes |
| -------------------- | -------------------- | ----------- | ----- |
| **UserUpdateSchema** | **UserUpdateSchema** |             |       |

### Return type

**UserSchema**

### Authorization

[SessionAuth](../README.md#SessionAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiCreateLegacy**

> LegacySceneOutSchema scenesApiCreateLegacy(LegacySceneInSchema)

### Example

```typescript
import { DefaultApi, Configuration, LegacySceneInSchema } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let LegacySceneInSchema: LegacySceneInSchema; //

const { status, data } =
  await apiInstance.scenesApiCreateLegacy(LegacySceneInSchema);
```

### Parameters

| Name                    | Type                    | Description | Notes |
| ----------------------- | ----------------------- | ----------- | ----- |
| **LegacySceneInSchema** | **LegacySceneInSchema** |             |       |

### Return type

**LegacySceneOutSchema**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     | Created     | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiCreateScene**

> SceneSchema scenesApiCreateScene(SceneCreateSchema)

### Example

```typescript
import { DefaultApi, Configuration, SceneCreateSchema } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let SceneCreateSchema: SceneCreateSchema; //

const { status, data } =
  await apiInstance.scenesApiCreateScene(SceneCreateSchema);
```

### Parameters

| Name                  | Type                  | Description | Notes |
| --------------------- | --------------------- | ----------- | ----- |
| **SceneCreateSchema** | **SceneCreateSchema** |             |       |

### Return type

**SceneSchema**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     | Created     | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiDeleteScene**

> scenesApiDeleteScene()

### Example

```typescript
import { DefaultApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let key: string; // (default to undefined)

const { status, data } = await apiInstance.scenesApiDeleteScene(key);
```

### Parameters

| Name    | Type         | Description | Notes                 |
| ------- | ------------ | ----------- | --------------------- |
| **key** | [**string**] |             | defaults to undefined |

### Return type

void (empty response body)

### Authorization

[SessionAuth](../README.md#SessionAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **204**     | No Content  | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiGetLegacy**

> LegacySceneOutSchema scenesApiGetLegacy()

### Example

```typescript
import { DefaultApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let key: string; // (default to undefined)

const { status, data } = await apiInstance.scenesApiGetLegacy(key);
```

### Parameters

| Name    | Type         | Description | Notes                 |
| ------- | ------------ | ----------- | --------------------- |
| **key** | [**string**] |             | defaults to undefined |

### Return type

**LegacySceneOutSchema**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiGetScene**

> SceneSchema scenesApiGetScene()

### Example

```typescript
import { DefaultApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let key: string; // (default to undefined)

const { status, data } = await apiInstance.scenesApiGetScene(key);
```

### Parameters

| Name    | Type         | Description | Notes                 |
| ------- | ------------ | ----------- | --------------------- |
| **key** | [**string**] |             | defaults to undefined |

### Return type

**SceneSchema**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiListScenes**

> PagedMiniSceneSchema scenesApiListScenes()

### Example

```typescript
import { DefaultApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let title: string; // (optional) (default to undefined)
let archived: boolean; // (optional) (default to undefined)
let limit: number; // (optional) (default to 20)
let offset: number; // (optional) (default to 0)

const { status, data } = await apiInstance.scenesApiListScenes(
  title,
  archived,
  limit,
  offset,
);
```

### Parameters

| Name         | Type          | Description | Notes                            |
| ------------ | ------------- | ----------- | -------------------------------- |
| **title**    | [**string**]  |             | (optional) defaults to undefined |
| **archived** | [**boolean**] |             | (optional) defaults to undefined |
| **limit**    | [**number**]  |             | (optional) defaults to 20        |
| **offset**   | [**number**]  |             | (optional) defaults to 0         |

### Return type

**PagedMiniSceneSchema**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiMyScenes**

> PagedMiniSceneSchema scenesApiMyScenes()

### Example

```typescript
import { DefaultApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let title: string; // (optional) (default to undefined)
let archived: boolean; // (optional) (default to undefined)
let limit: number; // (optional) (default to 20)
let offset: number; // (optional) (default to 0)

const { status, data } = await apiInstance.scenesApiMyScenes(
  title,
  archived,
  limit,
  offset,
);
```

### Parameters

| Name         | Type          | Description | Notes                            |
| ------------ | ------------- | ----------- | -------------------------------- |
| **title**    | [**string**]  |             | (optional) defaults to undefined |
| **archived** | [**boolean**] |             | (optional) defaults to undefined |
| **limit**    | [**number**]  |             | (optional) defaults to 20        |
| **offset**   | [**number**]  |             | (optional) defaults to 0         |

### Return type

**PagedMiniSceneSchema**

### Authorization

[SessionAuth](../README.md#SessionAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scenesApiUpdateScene**

> SceneSchema scenesApiUpdateScene(ScenePatchSchema)

### Example

```typescript
import { DefaultApi, Configuration, ScenePatchSchema } from "./api";

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let key: string; // (default to undefined)
let ScenePatchSchema: ScenePatchSchema; //

const { status, data } = await apiInstance.scenesApiUpdateScene(
  key,
  ScenePatchSchema,
);
```

### Parameters

| Name                 | Type                 | Description | Notes                 |
| -------------------- | -------------------- | ----------- | --------------------- |
| **ScenePatchSchema** | **ScenePatchSchema** |             |                       |
| **key**              | [**string**]         |             | defaults to undefined |

### Return type

**SceneSchema**

### Authorization

[SessionAuth](../README.md#SessionAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
