import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/mpesa-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        Body?: {
          stkCallback?: {
            CheckoutRequestID?: string;
            ResultCode?: number;
            ResultDesc?: string;
            CallbackMetadata?: {
              Item?: Array<{ Name: string; Value?: string | number }>;
            };
          };
        };
      };

      const callback = body?.Body?.stkCallback;
      if (!callback) {
        return new Response("Invalid callback", { status: 400 });
      }

      const checkoutRequestId = callback.CheckoutRequestID;
      const resultCode = callback.ResultCode;
      const resultDesc = callback.ResultDesc;

      if (!checkoutRequestId) {
        return new Response("Missing CheckoutRequestID", { status: 400 });
      }

      let mpesaReceiptNumber: string | undefined;
      if (resultCode === 0 && callback.CallbackMetadata?.Item) {
        const receiptItem = callback.CallbackMetadata.Item.find(
          (item) => item.Name === "MpesaReceiptNumber"
        );
        mpesaReceiptNumber = receiptItem?.Value as string | undefined;
      }

      await ctx.runMutation(api.mpesa.updatePaymentStatus, {
        checkoutRequestId,
        status: resultCode === 0 ? "completed" : "failed",
        mpesaReceiptNumber,
        resultCode: resultCode ?? undefined,
        resultDesc: resultDesc ?? undefined,
      });

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("M-Pesa callback error:", error);
      return new Response("Error processing callback", { status: 500 });
    }
  }),
});

// Serve uploaded images from Convex storage
http.route({
  path: "/getImage",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.searchParams.get("storageId");
    if (!storageId) return new Response("Missing storageId", { status: 400 });
    const blob = await ctx.storage.get(storageId);
    if (!blob) return new Response("Not found", { status: 404 });
    return new Response(blob);
  }),
});

export default http;
