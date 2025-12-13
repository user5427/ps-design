import axios from "axios";

export function getReadableError(
  error: unknown,
  badRequestMessage: string = "Invalid request data.",
): string {
  if (!error) return "Something went wrong.";

  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    if (error.response?.status === 400) return message || badRequestMessage;
    if (error.response?.status === 401) return message || badRequestMessage;
    if (error.response?.status === 500) return "Server error. Try again later.";

    return message || "Unable to process your request.";
  }

  if (error instanceof Error) {
    return error.message || "Unable to process your request.";
  }

  return "Unexpected error occurred.";
}
