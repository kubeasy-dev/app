import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { Pool } from "pg";
import { Resend } from "resend";
import { authClient } from "./auth-client";

// Lazy singleton DB pool — reused across requests
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

type EmailTopic = {
  id: string;
  name: string;
  description: string | null;
  defaultSubscription: "opt_in" | "opt_out";
  subscribed: boolean;
};

export const getEmailTopicsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailTopic[]> => {
    if (!process.env.RESEND_API_KEY) return [];

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Fetch all topics from Resend
    const topicsResponse = await resend.topics.list();
    if (!topicsResponse.data?.data || topicsResponse.error) return [];

    const allTopics = topicsResponse.data.data;
    const topics: EmailTopic[] = allTopics.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? null,
      defaultSubscription: t.default_subscription,
      subscribed: t.default_subscription === "opt_in",
    }));

    if (topics.length === 0) return [];

    // Try to get user's subscription status
    const headers = getRequestHeaders();
    const session = await authClient.getSession({
      fetchOptions: { headers: { Cookie: headers.get("Cookie") ?? "" } },
    });

    if (!session?.data?.user) return topics;

    const pool = getPool();
    const { rows } = await pool.query<{ resend_contact_id: string | null }>(
      'SELECT resend_contact_id FROM "user" WHERE id = $1',
      [session.data.user.id],
    );
    const resendContactId = rows[0]?.resend_contact_id;

    if (!resendContactId) return topics;

    try {
      const contactTopicsResponse = await resend.contacts.topics.list({
        id: resendContactId,
      });

      if (!contactTopicsResponse.data?.data) return topics;

      const subscriptionMap = new Map(
        contactTopicsResponse.data.data.map((t) => [
          t.id,
          t.subscription === "opt_in",
        ]),
      );

      return topics.map((topic) => ({
        ...topic,
        subscribed: subscriptionMap.has(topic.id)
          ? (subscriptionMap.get(topic.id) ?? topic.subscribed)
          : topic.subscribed,
      }));
    } catch {
      return topics;
    }
  },
);

export const updateEmailSubscriptionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { topicId: string; subscribed: boolean }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    if (!process.env.RESEND_API_KEY) throw new Error("Resend not configured");

    const headers = getRequestHeaders();
    const session = await authClient.getSession({
      fetchOptions: { headers: { Cookie: headers.get("Cookie") ?? "" } },
    });

    if (!session?.data?.user) throw new Error("Not authenticated");

    const pool = getPool();
    const { rows } = await pool.query<{ resend_contact_id: string | null }>(
      'SELECT resend_contact_id FROM "user" WHERE id = $1',
      [session.data.user.id],
    );
    const resendContactId = rows[0]?.resend_contact_id;

    if (!resendContactId) throw new Error("No Resend contact found");

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.contacts.topics.update({
      id: resendContactId,
      topics: [
        {
          id: data.topicId,
          subscription: data.subscribed ? "opt_in" : "opt_out",
        },
      ],
    });

    return { success: true };
  });
