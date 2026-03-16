/**
 * Run: node test_inquiry_api.js
 * Or:   EMAIL=admin@company.com PASSWORD=yourpass node test_inquiry_api.js
 *
 * This logs in, gets JWT, then creates an inquiry. Use the printed token in Postman.
 */
require("dotenv").config();

// For local test use: http://localhost:5000/api (server must be running)
const BASE = process.env.API_BASE_URL || "http://localhost:5000/api";
const EMAIL = process.env.EMAIL || "gitakshmi@gitakshmilabs.com";  // change to your admin email
const PASSWORD = process.env.PASSWORD || "123456";                 // change to your password

async function main() {
  console.log("1. Logging in...", BASE + "/auth/login");
  const loginRes = await fetch(BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await loginRes.json();

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, loginJson);
    process.exit(1);
  }

  const token = loginJson.token;
  if (!token) {
    console.error("No token in response:", loginJson);
    process.exit(1);
  }

  console.log("2. Login OK. Token (first 50 chars):", token.substring(0, 50) + "...");
  console.log("\n--- Use this token in Postman (Authorization > Bearer Token) ---\n");
  console.log(token);
  console.log("\n--- End token ---\n");

  console.log("3. Creating inquiry...", BASE + "/inquiries");
  const inquiryRes = await fetch(BASE + "/inquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify({
      name: "Manual Lead",
      email: "lead@test.com",
      phone: "9999888877",
      message: "Manual entry from CRM",
      source: "Manual",
      city: "Kerala",
      location: "Kerala",
      value: 50000,
    }),
  });
  const inquiryJson = await inquiryRes.json();

  if (!inquiryRes.ok) {
    console.error("Create inquiry failed:", inquiryRes.status, inquiryJson);
    process.exit(1);
  }

  console.log("4. Inquiry created successfully:", inquiryJson.data?._id || inquiryJson);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
