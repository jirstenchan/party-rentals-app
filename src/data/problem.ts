export function problemFor(e: unknown) {
  if (e instanceof Error && e.message === "timeout")
    return "The server took too long. Try again.";
  if (e instanceof TypeError)
    return "No connection. Check your Wi-Fi and try again.";
  if (e instanceof Error && e.message === "404")
    return "That list is not there any more.";
  if (e instanceof Error && e.message === "401") return "Sign in again.";
  if (e instanceof Error && e.message === "403")
    return "Only the admin can do that.";
  return "Something went wrong.";
}
export type Status = "loading" | "empty" | "error" | "content";
