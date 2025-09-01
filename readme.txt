Shopify App Hackathon Brief
Objective: Build simple, high-impact Shopify apps that solve clear merchant pain points. Each participant or team will choose one app idea from the list below and build a working prototype within 14 to 21 days.
Submission Deadline: August 29 2025 Project Duration: 14 to 21 days Target Users: Shopify merchants of all sizes

🔧 App Challenges & Requirements
Participants must choose one of the following app ideas. Each app should be built using Shopify's latest APIs, with a clean UX and minimal setup required for merchants. Apps should comply with Shopify App Store guidelines.


Here’s the numbered list so you can copy the numbers too:

Here’s your list with numbering added:

1. Enable preorder for selected products or variants via tag or manual switch (Create def via API and delete via API) we need to turn off

# 2. Preorder badge or label display
3. Set release/shipping date per item
5. Messaging options for preorder status (on product page and cart)
# 6. Countdown timer for preorder window or expected availability
7. Capture customer consent before placing preorder
10. Limit number of preorder units available
    - set quantities for preorder if exceed need to stop preorder

# 4. Allow full or partial payment (e.g., 30% upfront)

8. Add notes or tags in Shopify Orders to mark as preorder



11. Option to auto-cancel if customer fails to complete payment in X days
12. Handle partial refunds automatically if product release is delayed or canceled


9. Email notifications (optional): confirm preorder, notify when item ships, request balance payment

Reference App:
Essential Pre-Order


📋 Judging Criteria
Working Shopify embedded app with testable flow
The app should have functionalities / features at least 90% as in the reference app
UI/UX quality following Shopify Polaris design guidelines
Full use of Shopify App Bridge for embedded experiences
Follows Shopify App Store Developer Guidelines (app listing, billing, permissions, etc.)
Use of Shopify APIs, Functions, and Checkout UI Extensions where applicable
Performance standards aligned with Built for Shopify benchmarks:
CLS (Cumulative Layout Shift)
FCP (First Contentful Paint)
TBT (Total Blocking Time)
Fully responsive and accessible app UI
Clean uninstall logic and app lifecycle handling
Documentation and clarity of setup
App Store listing readiness with a clear value proposition
🛠️ Tech Stack Suggestions
Frontend: React + Polaris UI
Backend: NextJS / PHP / Laravel 
Shopify API: Admin API, Storefront API, App Bridge, Checkout UI Extensions, Functions
📎 Deliverables
GitHub repo access
Working demo 














2. How it works
When a customer purchases the product with this selling plan, Shopify will collect 30% at checkout and vault the payment method.
After 7 days, you (or your app) are responsible for triggering the charge for the remaining 70%. Shopify stores the payment mandate for this purpose.
3. Charging the Remaining Balance
To collect the remaining payment after 7 days, use the orderCreateMandatePayment mutation. You will need the order ID and the payment mandate information, which you can retrieve from the order's vaultedPaymentMethods field.

Example (simplified):
mutation {
  orderCreateMandatePayment(
    id: "gid://shopify/Order/ORDER_ID"
    idempotencyKey: "YOUR_UNIQUE_KEY"
    amount: {
      amount: "REMAINING_AMOUNT"
      currencyCode: USD
    }
    paymentMandateId: "gid://shopify/PaymentMandate/MANDATE_ID"
  ) {
    payment {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}
Replace ORDER_ID, REMAINING_AMOUNT, and MANDATE_ID with the actual values.
4. Notes and Responsibilities
Your app is responsible for scheduling and triggering the remaining payment after 7 days.
Shopify will store the payment method and allow you to charge the remaining balance using the mandate.
You can check the payment terms and status using the PaymentTerms object and the orderPaymentStatus query.
References and Further Reading
How pre-orders and TBYB work
Related resources
To learn more about the resources in the generated operation, refer to these related reference pages:

sellingPlanGroupCreate