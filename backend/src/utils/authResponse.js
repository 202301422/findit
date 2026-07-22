import { serializeUser } from "./userSerializer.js";

export const buildAuthSessionPayload = (user, accessToken) => ({
  accessToken,
  user: serializeUser(user),
});