# AuthApi

All URIs are relative to _http://localhost_

| Method                                                      | HTTP request                        | Description |
| ----------------------------------------------------------- | ----------------------------------- | ----------- |
| [**authUsersActivationCreate**](#authusersactivationcreate) | **POST** /v0/auth/users/activation/ |             |
| [**authUsersMeDeleteCreate**](#authusersmedeletecreate)     | **POST** /v0/auth/users/me/delete/  |             |
| [**authUsersMePartialUpdate**](#authusersmepartialupdate)   | **PATCH** /v0/auth/users/me/        |             |
| [**authUsersMeRetrieve**](#authusersmeretrieve)             | **GET** /v0/auth/users/me/          |             |

# **authUsersActivationCreate**

> authUsersActivationCreate(ActivateRequest)

Admin-only endpoint to activate a user and mark their email as verified.

### Example

```typescript
import { AuthApi, Configuration, ActivateRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let ActivateRequest: ActivateRequest; //

const { status, data } =
  await apiInstance.authUsersActivationCreate(ActivateRequest);
```

### Parameters

| Name                | Type                | Description | Notes |
| ------------------- | ------------------- | ----------- | ----- |
| **ActivateRequest** | **ActivateRequest** |             |       |

### Return type

void (empty response body)

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: application/json, application/x-www-form-urlencoded, multipart/form-data
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |
| **404**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authUsersMeDeleteCreate**

> authUsersMeDeleteCreate(DeleteAccountRequest)

Delete the current user\'s account (requires the current password). Modeled as a POST action rather than DELETE-with-body: drf-spectacular only emits request bodies for PUT/PATCH/POST, and per HTTP semantics a DELETE payload \"has no defined semantics\" (RFC 9110). A POST keeps the password requirement fully described by the OpenAPI spec and generated client.

### Example

```typescript
import { AuthApi, Configuration, DeleteAccountRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let DeleteAccountRequest: DeleteAccountRequest; //

const { status, data } =
  await apiInstance.authUsersMeDeleteCreate(DeleteAccountRequest);
```

### Parameters

| Name                     | Type                     | Description | Notes |
| ------------------------ | ------------------------ | ----------- | ----- |
| **DeleteAccountRequest** | **DeleteAccountRequest** |             |       |

### Return type

void (empty response body)

### Authorization

[cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: application/json, application/x-www-form-urlencoded, multipart/form-data
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authUsersMePartialUpdate**

> User authUsersMePartialUpdate()

GET and PATCH the current user\'s profile.

### Example

```typescript
import { AuthApi, Configuration, PatchedUserRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let PatchedUserRequest: PatchedUserRequest; // (optional)

const { status, data } =
  await apiInstance.authUsersMePartialUpdate(PatchedUserRequest);
```

### Parameters

| Name                   | Type                   | Description | Notes |
| ---------------------- | ---------------------- | ----------- | ----- |
| **PatchedUserRequest** | **PatchedUserRequest** |             |       |

### Return type

**User**

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

# **authUsersMeRetrieve**

> User authUsersMeRetrieve()

GET and PATCH the current user\'s profile.

### Example

```typescript
import { AuthApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

const { status, data } = await apiInstance.authUsersMeRetrieve();
```

### Parameters

This endpoint does not have any parameters.

### Return type

**User**

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
