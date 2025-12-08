import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth";
import type { LoginBody, UserResponse } from "@ps-design/schemas/auth";

export function useLogin() {
  return useMutation<UserResponse, Error, LoginBody>({
    mutationFn: async (request) => {
      return login(request);
    },
  });
}
