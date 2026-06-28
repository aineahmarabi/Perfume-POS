import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const initiateSTKPush = action({
  args: {
    phone: v.string(),
    amount: v.number(),
    saleReference: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; checkoutRequestId?: string; error?: string }> => {
    const settings = await ctx.runQuery(api.settings.getAll);

    const shortcode = settings["mpesa_shortcode"] ?? "174379";
    const passkey = settings["mpesa_passkey"] ?? "";
    const consumerKey = settings["mpesa_consumer_key"] ?? "";
    const consumerSecret = settings["mpesa_consumer_secret"] ?? "";
    const environment = settings["mpesa_environment"] ?? "sandbox";

    const baseUrl = environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    // Get OAuth token
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);
    let token: string;
    try {
      const tokenRes = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${credentials}` } }
      );
      const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        return { success: false, error: "Failed to get M-Pesa access token" };
      }
      token = tokenData.access_token;
    } catch {
      return { success: false, error: "M-Pesa authentication failed. Check credentials." };
    }

    // Format timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Format phone — ensure 254XXXXXXXXX
    const phone = args.phone.startsWith("0")
      ? `254${args.phone.slice(1)}`
      : args.phone.startsWith("+")
      ? args.phone.slice(1)
      : args.phone;

    const callbackUrl = "https://example.com/mpesa-callback"; // Update with actual callback URL in production

    try {
      const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.ceil(args.amount),
          PartyA: phone,
          PartyB: shortcode,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: args.saleReference,
          TransactionDesc: "Perfume Purchase",
        }),
      });

      const stkData = await stkRes.json() as {
        CheckoutRequestID?: string;
        MerchantRequestID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
        CustomerMessage?: string;
      };

      if (stkData.ResponseCode === "0") {
        await ctx.runMutation(api.mpesa.createPendingPayment, {
          saleReference: args.saleReference,
          phone,
          amount: args.amount,
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
        });
        return { success: true, checkoutRequestId: stkData.CheckoutRequestID };
      }

      return {
        success: false,
        error: stkData.ResponseDescription ?? "STK push failed",
      };
    } catch {
      return { success: false, error: "Failed to send STK push" };
    }
  },
});

export const createPendingPayment = mutation({
  args: {
    saleReference: v.string(),
    phone: v.string(),
    amount: v.number(),
    checkoutRequestId: v.optional(v.string()),
    merchantRequestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("mpesaPayments", {
      ...args,
      status: "processing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getPendingPayment = query({
  args: { checkoutRequestId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("mpesaPayments")
      .withIndex("by_checkout_request", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId)
      )
      .first();
  },
});

export const updatePaymentStatus = mutation({
  args: {
    checkoutRequestId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    mpesaReceiptNumber: v.optional(v.string()),
    resultCode: v.optional(v.number()),
    resultDesc: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("mpesaPayments")
      .withIndex("by_checkout_request", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId)
      )
      .first();

    if (!payment) return;

    await ctx.db.patch(payment._id, {
      status: args.status,
      mpesaReceiptNumber: args.mpesaReceiptNumber,
      resultCode: args.resultCode,
      resultDesc: args.resultDesc,
      updatedAt: Date.now(),
    });
  },
});
