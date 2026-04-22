export const baseUrl =
  process.env.NODE_ENV === "development"
    ? new URL("http://localhost:3024/docs")
    : new URL(`https://kubeasy.dev/docs`);
