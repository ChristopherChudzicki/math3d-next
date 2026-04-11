import axios from "axios";
import type { AxiosInstance } from "axios";

type DeleteUserMeParams = {
  current_password: string;
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

export { deleteUserMe };
export type { DeleteUserMeParams };
