import { createServerFn } from "@tanstack/react-start";
import { api } from "./api-client";

export type EmailTopic = {
  id: string;
  name: string;
  description: string | null;
  defaultSubscription: "opt_in" | "opt_out";
  subscribed: boolean;
};

export const getEmailTopicsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailTopic[]> => {
    return api.user.emailTopics();
  },
);

export const updateEmailSubscriptionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { topicId: string; subscribed: boolean }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    return api.user.updateEmailTopic(data.topicId, data.subscribed);
  });
