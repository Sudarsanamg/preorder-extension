import { z } from "zod";


// export const CampaignSchema = z.object({
//   campaignName: z
//     .string()
//     .min(1, "Campaign name is required")
//     .max(50, "Campaign name must be under 50 characters"),
//   campaignType: z.coerce.number({ error: "Campaign type is required" }),
//   productTags: z
//     .array(z.string())
//     .nonempty("At least one product tag is required"),
//   customerTags: z
//     .array(z.string())
//     .nonempty("At least one customer tag is required"),
//   preOrderNoteKey: z
//     .string()
//     .min(1, "Note key is required")
//     .max(30, "Note key must be under 30 characters"),
//   preOrderNoteValue: z
//     .string()
//     .min(1, "Note value is required")
//     .max(30, "Note value must be under 30 characters"),
//   buttonText: z
//     .string()
//     .min(1, "Button text is required")
//     .max(30, "Button text must be under 30 characters"),
//   shippingMessage: z
//     .string()
//     .min(1, "Shipping message is required")
//     .max(30, "Shipping message must be under 30 characters"),
//   partialPaymentPercentage: z
//     .string()
//     .refine(
//       (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
//       "Partial payment percentage must be a number between 0 and 100"
//     ),
//   paymentMode: z.enum(["full", "partial"], {
//     error: "Payment mode is required",
//   }),
//   partialPaymentType: z.enum(["percent", "flat"], {
//     error: "Partial payment type is required",
//   }),
//   duePaymentType: z.number({ error: "Due payment type is required" }),
//   campaignEndTime: z.string().min(1, "Campaign end time is required"),
//   fulfilmentMode: z.string().min(1, "Fulfilment mode is required"),
//   scheduledFullfillmentType: z.number({
//     error: "Scheduled fulfilment type is required",
//   }),
//   scheduledDays: z.string().min(1, "Scheduled days are required"),
//   paymentAfterDays: z.string().min(1, "Payment after days is required"),
//   fullPaymentText: z.string().min(1, "Full payment text is required"),
//   partialPaymentText: z.string().min(1, "Partial payment text is required"),
//   partialPaymentInfoText: z.string().min(1, "Partial payment info is required"),
//   discountType: z.enum(["PERCENTAGE", "FIXED"], {
//     error: "Discount type is required",
//   }),
//   discountPercentage: z
//     .number()
//     .min(0, "Discount percentage must be at least 0")
//     .max(99, "Discount percentage must be below 100"),
//   flatDiscount: z.number().min(0, "Flat discount cannot be negative"),
//   getPaymentsViaValtedPayments: z.boolean({
//     error: "Please specify if vaulted payments are enabled",
//   }),
// });



export const CampaignSchema = z.object({
  campaignName: z
    .string()
    .min(1, "Campaign name is required")
    .max(50, "Campaign name must be under 50 characters"),

  campaignType: z.coerce.number().refine(v => [1, 2, 3].includes(v), "Invalid campaign type"),

  productTags: z.array(z.string()).nonempty("At least one product tag is required"),
  customerTags: z.array(z.string()).nonempty("At least one customer tag is required"),

  preOrderNoteKey: z.string().min(1, "Note key is required").max(30),
  preOrderNoteValue: z.string().min(1, "Note value is required").max(30),

  buttonText: z.string().min(1).max(30),
  shippingMessage: z.string().min(1).max(30),

  partialPaymentPercentage: z.coerce
    .number()
    .min(1, "Partial payment percentage must be at least 1%")
    .max(99, "Partial payment percentage must be at most 99%"),

  paymentMode: z.enum(["full", "partial"], { error : "Payment mode is required" }),
  partialPaymentType: z.enum(["percent", "flat"], { error : "Partial payment type is required" }) ,

  duePaymentType: z.coerce.number({ error: "Due payment type is required" }),
  campaignEndTime: z.string().min(1, "Campaign end time is required"),
  fulfilmentMode: z.string().min(1, "Fulfilment mode is required"),
  scheduledFullfillmentType: z.coerce.number({ error: "Scheduled fulfilment type is required" }),

  scheduledDays: z.coerce.string().min(1, "Scheduled days are required"),
  paymentAfterDays: z.coerce.string().min(1, "Payment after days is required"),

  fullPaymentText: z.string().min(1, "Full payment text is required"),
  partialPaymentText: z.string().min(1, "Partial payment text is required"),
  partialPaymentInfoText: z.string().min(1, "Partial payment info is required"),

  discountType: z.enum(["PERCENTAGE", "FIXED"], { error : "Discount type is required" }) ,

  discountPercentage: z.coerce
    .number()
    .min(0, "Discount percentage must be at least 0")
    .max(99, "Discount percentage must be below 100"),

  flatDiscount: z.coerce.number().min(0, "Flat discount cannot be negative").max(999999,'Flat discount cannot be more than 6 Digits'),

  getPaymentsViaValtedPayments: z.boolean({
    error : "Please specify if vaulted payments are enabled" }),
});

// export const DesignSchema = z.object({
//   messageFontSize: z
//     .string()
//     .refine(
//       (v) => Number(v) > 0 && Number(v) <= 25,
//       "Message font size must be between 1 and 25px"
//     ),
//   messageColor: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid message color hex code"),
//   fontFamily: z.string().min(1, "Font family is required"),
//   buttonStyle: z.enum(["single", "gradient"], {
//     error: "Button style is required",
//   }),
//   buttonBackgroundColor: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid button background color"),
//   gradientDegree: z.string().min(1, "Gradient degree is required"),
//   gradientColor1: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid gradient color 1"),
//   gradientColor2: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid gradient color 2"),
//   borderSize: z
//     .string()
//     .refine((v) => Number(v) >= 0, "Border size must be a positive number"),
//   borderColor: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid border color"),
//   spacingIT: z
//     .string()
//     .min(1, "Inner top spacing is required")
//     .max(50, "Inner top spacing must be under 50px"),
//   spacingIB: z
//     .string()
//     .min(1, "Inner bottom spacing is required")
//     .max(50, "Inner bottom spacing must be under 50px"),
//   spacingOT: z
//     .string()
//     .min(1, "Outer top spacing is required")
//     .max(50, "Outer top spacing must be under 50px"),
//   spacingOB: z
//     .string()
//     .min(1, "Outer bottom spacing is required")
//     .max(50, "Outer bottom spacing must be under 50px"),
//   borderRadius: z
//     .string()
//     .min(1, "Border radius is required")
//     .max(100, "Border radius must be under 100px"),
//   preorderMessageColor: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid preorder message color"),
//   buttonFontSize: z
//     .string()
//     .refine(
//       (v) => Number(v) > 0 && Number(v) <= 25,
//       "Button font size must be between 1 and 25px"
//     ),
//   buttonTextColor: z
//     .string()
//     .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid button text color"),
// });




export const DesignSchema = z.object({
  // ✅ Font size — coerces to number, ensures 1–25px
  messageFontSize: z.coerce
    .number()
    .min(1, "Message font size must be between 1 and 50px")
    .max(50, "Message font size must be between 1 and 50px"),

  // ✅ Hex color validation
  messageColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid message color hex code"),

  fontFamily: z.string().min(1, "Font family is required"),

  // ✅ Button style
  buttonStyle: z.enum(["single", "gradient"], {
    error : "Button style is required" }),

  // ✅ Background and gradient colors
  buttonBackgroundColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid button background color"),

  gradientDegree: z.coerce
    .number()
    .min(0, "Gradient degree must be 0 or higher")
    .max(360, "Gradient degree must be under 360°"),

  gradientColor1: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid gradient color 1"),

  gradientColor2: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid gradient color 2"),

  // ✅ Border
  borderSize: z.union([
  z
    .string()
    .refine((v) => v.trim() !== "", "Border size is required")
    .refine(
      (v) => !isNaN(Number(v)),
      "Border size must be a valid number"
    )
    .refine(
      (v) => Number(v) >= 0 && Number(v) <= 50,
      "Border size must be between 0 and 50px"
    ),
  z
    .number()
    .min(0, { message: "Border size cannot be negative" })
    .max(50, { message: "Border size must be under 50px" }),
]),


  borderColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid border color"),

  // ✅ Spacing (inner + outer)
  spacingIT: z.coerce
    .number()
    .min(1, "Inner top spacing is required")
    .max(50, "Inner top spacing must be under 50px"),

  spacingIB: z.coerce
    .number()
    .min(1, "Inner bottom spacing is required")
    .max(50, "Inner bottom spacing must be under 50px"),

  spacingOT: z.coerce
    .number()
    .min(1, "Outer top spacing is required")
    .max(50, "Outer top spacing must be under 50px"),

  spacingOB: z.coerce
    .number()
    .min(1, "Outer bottom spacing is required")
    .max(50, "Outer bottom spacing must be under 50px"),

  // ✅ Border radius
  borderRadius: z.coerce
    .number()
    .min(1, "Border radius is required")
    .max(100, "Border radius must be under 100px"),

  // ✅ Preorder message color
  preorderMessageColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid preorder message color"),

  // ✅ Button font size
  buttonFontSize: z.coerce
    .number()
    .min(1, "Button font size must be between 1 and 50px")
    .max(50, "Button font size must be between 1 and 50px"),

  // ✅ Button text color
  buttonTextColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Invalid button text color"),
});
