import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth";
import type { LoginBody, LoginResponse } from "@ps-design/schemas/schemas/auth";

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginBody>({
    mutationFn: async (request) => {
      return login(request);
    },
  });
}
