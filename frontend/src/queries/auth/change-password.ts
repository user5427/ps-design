import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/api/auth";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@/schemas/auth";

export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: async (request) => {
      return changePassword(request);
    },
  });
}
