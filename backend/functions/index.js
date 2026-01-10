const { onInit, setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall, HttpsError } = require("firebase-functions/https");
const { defineString } = require('firebase-functions/params');
const logger = require("firebase-functions/logger");
const PAYSTACK_SECRET_KEY = defineString('PAYSTACK_SECRET_KEY');
const Paystack = require('paystack-api')(PAYSTACK_SECRET_KEY.value());

setGlobalOptions({ maxInstances: 10 });


exports.createPaymentIntent = onCall(async (request) => {
    const { amount, currency = "GHS" } = request.data;
    if (!amount || amount <= 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a positive amount.");
    }
    try {
        const response = await Paystack.transaction.initialize({
            amount: Math.round(amount * 100), // Paystack expects amount in pesewas for GHS
            currency,
            email: request.auth?.token.email || 'customer@example.com', // Need email
            callback_url: 'https://yourapp.com/callback', // Optional
        });
        return { authorizationUrl: response.data.authorization_url, reference: response.data.reference };
    } catch (error) {
        logger.error("Error creating payment:", error);
        throw new HttpsError("internal", "Failed to create payment.");
    }
});
