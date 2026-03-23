import axios from "axios";
import type { AxiosInstance } from "axios";

type DeleteUserParams = {
  id: number;
  currentPassword: string;
};

type DeleteUserMeParams = {
  current_password: string;
};

/**
 * Delete specified user.
 *
 * NOTES
 * =====
 * - This exists because our generated API spec+client does not include the
 * delete request body.
 * - This request requires admin privileges.
 */
const deleteUser = async (
  { id, currentPassword }: DeleteUserParams,
  basePath: string,
  instance: AxiosInstance = axios,
) => {
  return instance.delete(`v0/auth/users/${id}/`, {
    data: { current_password: currentPassword },
    baseURL: basePath,
  });
};

/**
 * Delete current user's account.
 *
 * NOTES
 * =====
 * - This exists because our generated API spec+client does not include the
 * delete request body.
 */
const deleteUserMe = async (
  { current_password: currentPassword }: DeleteUserMeParams,
  basePath: string,
  instance: AxiosInstance = axios,
) => {
  return instance.delete(`/v0/auth/users/me/`, {
    data: { current_password: currentPassword },
    baseURL: basePath,
  });
};

export { deleteUser, deleteUserMe };
export type { DeleteUserMeParams };
