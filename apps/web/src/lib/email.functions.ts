import { createServerFn } from "@tanstack/react-start";
import { rpc, unwrap } from "./rpc";

export type EmailTopic = {
  id: string;
  name: string;
  description: string | null;
  defaultSubscription: "opt_in" | "opt_out";
  subscribed: boolean;
};

export const getEmailTopicsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailTopic[]> => {
    return unwrap(rpc.user["email-topics"].$get());
  },
);

export const updateEmailSubscriptionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { topicId: string; subscribed: boolean }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const res = await rpc.user["email-topics"][":topicId"].$patch({
      param: { topicId: data.topicId },
      json: { subscribed: data.subscribed },
    });
    if (!res.ok) throw new Error(`update email topic failed: ${res.status}`);
    return res.json() as Promise<{ success: boolean }>;
  });
