import {
  getSubscriptionOverride,
  listSubscriptionsForUser,
} from "@/lib/firestore";
import {
  resolveEffectiveSubscription,
  selectPrimarySubscription,
} from "@/lib/subscriptions";

export async function getEffectiveSubscriptionAccess(userId: string) {
  const [subscriptions, override] = await Promise.all([
    listSubscriptionsForUser(userId),
    getSubscriptionOverride(userId),
  ]);

  return resolveEffectiveSubscription(
    selectPrimarySubscription(subscriptions),
    override,
  );
}
