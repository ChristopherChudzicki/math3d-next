# AllauthApi

All URIs are relative to _http://localhost_

| Method                                  | HTTP request                                           | Description      |
| --------------------------------------- | ------------------------------------------------------ | ---------------- |
| [**changePassword**](#changepassword)   | **POST** /\_allauth/browser/v1/account/password/change | Change password  |
| [**login**](#login)                     | **POST** /\_allauth/browser/v1/auth/login              | Login            |
| [**logout**](#logout)                   | **DELETE** /\_allauth/browser/v1/auth/session          | Logout           |
| [**requestPassword**](#requestpassword) | **POST** /\_allauth/browser/v1/auth/password/request   | Request password |
| [**resetPassword**](#resetpassword)     | **POST** /\_allauth/browser/v1/auth/password/reset     | Reset password   |
| [**signup**](#signup)                   | **POST** /\_allauth/browser/v1/auth/signup             | Signup           |
| [**verifyEmail**](#verifyemail)         | **POST** /\_allauth/browser/v1/auth/email/verify       | Verify an email  |

# **changePassword**

> changePassword()

In order to change the password of an account, the current and new password must be provider. However, accounts that were created by signing up using a third-party provider do not have a password set. In that case, the current password is not required.

### Example

```typescript
import { AllauthApi, Configuration, ChangePasswordRequest } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

let ChangePasswordRequest: ChangePasswordRequest; // (optional)

const { status, data } = await apiInstance.changePassword(
  ChangePasswordRequest,
);
```

### Parameters

| Name                      | Type                      | Description | Notes |
| ------------------------- | ------------------------- | ----------- | ----- |
| **ChangePasswordRequest** | **ChangePasswordRequest** |             |       |

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description              | Response headers |
| ----------- | ------------------------ | ---------------- |
| **400**     | An input error occurred. | -                |
| **401**     | Not authenticated.       | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **login**

> AuthenticatedResponse login(Login)

Login using a username-password or email-password combination.

### Example

```typescript
import { AllauthApi, Configuration, Login } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

let Login: Login; //Login.

const { status, data } = await apiInstance.login(Login);
```

### Parameters

| Name      | Type      | Description | Notes |
| --------- | --------- | ----------- | ----- |
| **Login** | **Login** | Login.      |       |

### Return type

**AuthenticatedResponse**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                                                              | Response headers |
| ----------- | ------------------------------------------------------------------------ | ---------------- |
| **200**     | Authenticated by password.                                               | -                |
| **400**     | An input error occurred.                                                 | -                |
| **401**     | Not authenticated.                                                       | -                |
| **409**     | Conflict. For example, when logging in when a user is already logged in. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logout**

> logout()

Logs out the user from the current session.

### Example

```typescript
import { AllauthApi, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

const { status, data } = await apiInstance.logout();
```

### Parameters

This endpoint does not have any parameters.

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                        | Response headers |
| ----------- | ---------------------------------- | ---------------- |
| **401**     | There is no authenticated session. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **requestPassword**

> RequestPassword200Response requestPassword(RequestPassword)

Initiates the password reset procedure. Depending on whether or not `ACCOUNT_PASSWORD_RESET_BY_CODE_ENABLED` is `True`, the procedure is either stateless or stateful. In case codes are used, it is stateful, and a new `password_reset_by_code` flow is started. In this case, on a successful password reset request, you will receive a 401 indicating the pending status of this flow. In case password reset is configured to use (stateless) links, you will receive a 200 on a successful password reset request.

### Example

```typescript
import { AllauthApi, Configuration, RequestPassword } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

let RequestPassword: RequestPassword; //Request password.

const { status, data } = await apiInstance.requestPassword(RequestPassword);
```

### Parameters

| Name                | Type                | Description       | Notes |
| ------------------- | ------------------- | ----------------- | ----- |
| **RequestPassword** | **RequestPassword** | Request password. |       |

### Return type

**RequestPassword200Response**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description              | Response headers |
| ----------- | ------------------------ | ---------------- |
| **200**     | A success response.      | -                |
| **400**     | An input error occurred. | -                |
| **401**     | Not authenticated.       | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **resetPassword**

> AuthenticatedResponse resetPassword()

Perform the password reset, by handing over the password reset key and the new password. After successfully completing the password reset, the user is either logged in (in case `ACCOUNT_LOGIN_ON_PASSWORD_RESET` is `True`), or, the user will need to proceed to the login page. In case of the former, a `200` status code is returned, in case of the latter a 401.

### Example

```typescript
import { AllauthApi, Configuration, ResetPassword } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

let ResetPassword: ResetPassword; // (optional)

const { status, data } = await apiInstance.resetPassword(ResetPassword);
```

### Parameters

| Name              | Type              | Description | Notes |
| ----------------- | ----------------- | ----------- | ----- |
| **ResetPassword** | **ResetPassword** |             |       |

### Return type

**AuthenticatedResponse**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                                                  | Response headers |
| ----------- | ------------------------------------------------------------ | ---------------- |
| **200**     | Authenticated by password.                                   | -                |
| **400**     | An input error occurred.                                     | -                |
| **401**     | Not authenticated.                                           | -                |
| **409**     | Conflict. There is no password reset (by code) flow pending. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **signup**

> AuthenticatedResponse signup(Signup)

Whether or not `username`, `email`, `phone` or combination of those are required depends on the configuration of django-allauth. Additionally, if a custom signup form is used there may be other custom properties required.

### Example

```typescript
import { AllauthApi, Configuration, Signup } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

let Signup: Signup; //Signup

const { status, data } = await apiInstance.signup(Signup);
```

### Parameters

| Name       | Type       | Description | Notes |
| ---------- | ---------- | ----------- | ----- |
| **Signup** | **Signup** | Signup      |       |

### Return type

**AuthenticatedResponse**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                                                     | Response headers |
| ----------- | --------------------------------------------------------------- | ---------------- |
| **200**     | Authenticated by password.                                      | -                |
| **400**     | An input error occurred.                                        | -                |
| **401**     | Not authenticated.                                              | -                |
| **403**     | Forbidden. For example, when signup is closed.                  | -                |
| **409**     | Conflict. For example, when signing up while user is logged in. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **verifyEmail**

> AuthenticatedResponse verifyEmail()

Complete the email verification process. Depending on the configuration, email addresses are either verified by opening a link that is sent to their email address, or, by inputting a code that is sent. On the API, both cases are handled identically. Meaning, the required key is either the one from the link, or, the code itself. Note that a status code of 401 does not imply failure. It indicates that the email verification was successful, yet, the user is still not signed in. For example, in case `ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION` is set to `False`, a 401 is returned when verifying as part of login/signup.

### Example

```typescript
import { AllauthApi, Configuration, VerifyEmail } from "./api";

const configuration = new Configuration();
const apiInstance = new AllauthApi(configuration);

let VerifyEmail: VerifyEmail; // (optional)

const { status, data } = await apiInstance.verifyEmail(VerifyEmail);
```

### Parameters

| Name            | Type            | Description | Notes |
| --------------- | --------------- | ----------- | ----- |
| **VerifyEmail** | **VerifyEmail** |             |       |

### Return type

**AuthenticatedResponse**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                                                     | Response headers |
| ----------- | --------------------------------------------------------------- | ---------------- |
| **200**     | The user is authenticated.                                      | -                |
| **400**     | An input error occurred.                                        | -                |
| **401**     | There is no authenticated session.                              | -                |
| **409**     | Conflict. The email verification (by code) flow is not pending. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
