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
  id: number;
  resendTopicId: string;
  name: string;
  description: string | null;
  defaultOptIn: boolean;
  subscribed: boolean;
};

export const getEmailTopicsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailTopic[]> => {
    const headers = getRequestHeaders();
    const session = await authClient.getSession({
      fetchOptions: { headers: { Cookie: headers.get("Cookie") ?? "" } },
    });

    const pool = getPool();

    // Fetch all topics from the DB
    const { rows: topicRows } = await pool.query<{
      id: number;
      resend_topic_id: string;
      name: string;
      description: string | null;
      default_opt_in: boolean;
    }>(
      "SELECT id, resend_topic_id, name, description, default_opt_in FROM email_topic ORDER BY id",
    );

    const topics: EmailTopic[] = topicRows.map((row) => ({
      id: row.id,
      resendTopicId: row.resend_topic_id,
      name: row.name,
      description: row.description,
      defaultOptIn: row.default_opt_in,
      subscribed: row.default_opt_in,
    }));

    // If no session, return topics with default opt-in status
    if (!session?.data?.user) {
      return topics;
    }

    const userId = session.data.user.id;

    // Get user's Resend contact ID
    const { rows: userRows } = await pool.query<{
      resend_contact_id: string | null;
    }>('SELECT resend_contact_id FROM "user" WHERE id = $1', [userId]);
    const resendContactId = userRows[0]?.resend_contact_id;

    // If no Resend contact or no API key, return defaults
    if (!resendContactId || !process.env.RESEND_API_KEY) {
      return topics;
    }

    // Fetch subscription status from Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const response = await resend.contacts.topics.list({
        id: resendContactId,
      });

      if (!response.data || !Array.isArray(response.data.data)) {
        // Graceful degradation: return defaultOptIn on unexpected response
        return topics;
      }

      const subscriptionMap = new Map(
        response.data.data.map((t) => [t.id, t.subscription === "opt_in"]),
      );

      return topics.map((topic) => ({
        ...topic,
        subscribed: subscriptionMap.has(topic.resendTopicId)
          ? (subscriptionMap.get(topic.resendTopicId) ?? topic.defaultOptIn)
          : topic.defaultOptIn,
      }));
    } catch (error) {
      // Graceful degradation: log error and return defaultOptIn
      console.error(
        "[email.functions] Failed to fetch Resend subscriptions:",
        error,
      );
      return topics;
    }
  },
);

export const updateEmailSubscriptionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { topicId: number; subscribed: boolean }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const headers = getRequestHeaders();
    const session = await authClient.getSession({
      fetchOptions: { headers: { Cookie: headers.get("Cookie") ?? "" } },
    });

    if (!session?.data?.user) {
      throw new Error("Not authenticated");
    }

    const userId = session.data.user.id;
    const pool = getPool();

    // Look up the email topic
    const { rows: topicRows } = await pool.query<{ resend_topic_id: string }>(
      "SELECT resend_topic_id FROM email_topic WHERE id = $1",
      [data.topicId],
    );
    const topic = topicRows[0];
    if (!topic) {
      throw new Error("Email topic not found");
    }

    // Get user's Resend contact ID
    const { rows: userRows } = await pool.query<{
      resend_contact_id: string | null;
    }>('SELECT resend_contact_id FROM "user" WHERE id = $1', [userId]);
    const resendContactId = userRows[0]?.resend_contact_id;

    if (!resendContactId) {
      throw new Error("No Resend contact found");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.contacts.topics.update({
      id: resendContactId,
      topics: [
        {
          id: topic.resend_topic_id,
          subscription: data.subscribed ? "opt_in" : "opt_out",
        },
      ],
    });

    return { success: true };
  });
