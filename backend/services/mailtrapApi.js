// mailtrapAPI.js
export async function sendOtpEmail(toEmail, code) {
  const token = process.env.MAILTRAP_API_TOKEN;
  const inboxId = process.env.MAILTRAP_INBOX_ID;

  if (!token || !inboxId) {
    throw new Error("MAILTRAP_API_TOKEN or MAILTRAP_INBOX_ID is missing");
  }

  const payload = {
    inbox_id: Number(inboxId),
    from: {
      email: process.env.EMAIL_FROM || "no-reply@jobmatch.dev",
      name: "JobMatch",
    },
    to: [{ email: toEmail }],
    subject: "Your verification code",
    text: `Your OTP code is: ${code}`,
    html: `<p>Your OTP code is: <b>${code}</b></p>`,
  };

  const res = await fetch("https://mailtrap.io/api/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Token": token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailtrap API failed: ${res.status} ${text}`);
  }
}
