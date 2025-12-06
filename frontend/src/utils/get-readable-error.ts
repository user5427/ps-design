export function getReadableError(error: unknown, badRequestMessage: string): string {
  if (!error) return 'Something went wrong.'

  if (error instanceof Error) {
    try {
      const data = JSON.parse(error.message)
      if (data?.message) return data.message
    } catch (_) {}

    if (error.message.includes('401')) {
      return badRequestMessage
    }
    if (error.message.includes('500')) {
      return 'Server error. Try again later.'
    }

    return 'Unable to process your request.'
  }

  return 'Unexpected error occurred.'
}
