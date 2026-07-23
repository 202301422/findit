export const serializeUser = (user) => {
  if (!user) {
    return null;
  }

  const plainUser = typeof user.toObject === "function" ? user.toObject() : user;

  return {
    _id: plainUser._id?.toString?.() ?? plainUser._id,
    id: plainUser._id?.toString?.() ?? plainUser.id,
    name: plainUser.name ?? "",
    email: plainUser.email ?? "",
    phone: plainUser.phone ?? "",
    username: plainUser.username ?? "",
    avatar: plainUser.avatar ?? "",
    avatarPublicId: plainUser.avatarPublicId ?? "",
    bio: plainUser.bio ?? "",
    college: plainUser.college ?? "",
    city: plainUser.city ?? "",
    state: plainUser.state ?? "",
    country: plainUser.country ?? "",
    isVerified: Boolean(plainUser.isVerified),
    authProvider: plainUser.authProvider ?? "local",
    accountStatus: plainUser.accountStatus ?? "active",
    role: plainUser.role ?? "user",
    savedPosts: (plainUser.savedPosts || []).map((sp) => ({
      itemId: sp.itemId?._id?.toString?.() ?? sp.itemId?.toString?.() ?? String(sp.itemId ?? sp),
      itemType: sp.itemType ?? "",
      savedAt: sp.savedAt ?? undefined,
    })),
    createdAt: plainUser.createdAt ?? undefined,
    updatedAt: plainUser.updatedAt ?? undefined,
  };
};