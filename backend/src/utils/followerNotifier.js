import User from "../models/user.model.js";
import UserNotification from "../models/userNotification.model.js";

/**
 * Sends a UserNotification to all followers of sellerId who have notifyOnPost enabled.
 */
export async function notifyFollowersOnNewPost({ sellerId, sellerName, itemTitle, itemType, itemId }) {
  try {
    const seller = await User.findById(sellerId).select("name followers").lean();
    if (!seller || !seller.followers || seller.followers.length === 0) return;

    const notifyFollowers = seller.followers.filter((f) => f.notifyOnPost !== false);
    if (notifyFollowers.length === 0) return;

    const displayName = sellerName || seller.name || "A user you follow";

    const notifications = notifyFollowers.map((f) => ({
      recipient: f.user,
      title: `New Post from ${displayName}! 🔔`,
      message: `${displayName} posted a new listing: "${itemTitle}"`,
      type: "listing_update",
      relatedEntityId: String(itemId),
      relatedEntityType: itemType === "found" ? "FoundProduct" : itemType === "pass" ? "Pass" : itemType === "ticket" ? "Ticket" : "SellProduct",
    }));

    await UserNotification.insertMany(notifications);
  } catch (err) {
    console.error("Error notifying followers on new post:", err);
  }
}
