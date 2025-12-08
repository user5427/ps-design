import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/api/auth";
import type {
  ChangePasswordBody,
} from "@ps-design/schemas/auth";
import type { SuccessResponse } from "@ps-design/schemas/shared/response-types";

export function useChangePassword() {
  return useMutation<SuccessResponse, Error, ChangePasswordBody>({
    mutationFn: async (request) => {
      return changePassword(request);
    },
  });
}
