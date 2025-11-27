import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

const secretsClient = new SecretsManagerClient({});
let cachedCredentials = null;

async function getDbCredentials() {
  if (cachedCredentials) return cachedCredentials;

  const secretId = process.env.DB_SECRET_ARN;
  if (!secretId) {
    throw new Error("DB_SECRET_ARN não está definido");
  }

  const resp = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  if (!resp.SecretString) {
    throw new Error("SecretString vazio no Secrets Manager");
  }

  const parsed = JSON.parse(resp.SecretString);
  cachedCredentials = parsed;
  return parsed;
}

export const handler = async (event) => {
  console.log("Request event:", JSON.stringify(event));
 if (event.requestContext?.http?.method === "POST" &&
      event.rawPath === "/public/agent-interest") {

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("Erro ao parsear body:", e);
    }

    console.log("agent-interest", {
      ...payload,
      receivedAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: true })
    };
  }

  try {
    const creds = await getDbCredentials();

        const host =
      process.env.DB_HOST ||
      creds.host ||
      creds.hostname ||
      "localhost";

    const client = new Client({
      host,
      database: creds.dbname,
      user: creds.username,
      password: creds.password,
      port: creds.port || 5432,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    const result = await client.query("SELECT 1 as ok");
    await client.end();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        service: "Fibonacci Orquestrador",
        environment: process.env.APP_ENV || "dev",
        db_status: result.rows[0].ok === 1 ? "connected" : "unknown",
      }),
    };
  } catch (err) {
    console.error("Erro na Lambda:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "DB connection failed",
        message: err.message,
      }),
    };
  }
};
