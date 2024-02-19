import axios from "axios";
import type { AxiosInstance } from "axios";
import type { Configuration } from "../../generated";

type DeleteUserParams = {
  id: number;
  currentPassword: string;
};

/**
 * Delete specified user.
 *
 * NOTES
 * =====
 * - This exists because our generated API spec+client does not include the
 * delete request body.
 * - This request requires admin priveleges.
 */
const deleteUser = async (
  { id, currentPassword }: DeleteUserParams,
  config: Configuration,
  instance: AxiosInstance = axios,
) => {
  const key = await (typeof config.apiKey === "function" // pragma: allowlist secret
    ? config.apiKey("Authorization")
    : config.apiKey);

  return instance.delete(`v0/auth/users/${id}/`, {
    data: { current_password: currentPassword },
    headers: {
      Authorization: key,
    },
  });
};

export { deleteUser };
