import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/api/auth";
import type { ChangePasswordBody, SuccessResponse } from "@ps-design/schemas/auth";

export function useChangePassword() {
  return useMutation<SuccessResponse, Error, ChangePasswordBody>({
    mutationFn: async (request) => {
      return changePassword(request);
    },
  });
}
