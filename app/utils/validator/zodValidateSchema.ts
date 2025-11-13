import { z } from "zod";





export const CampaignSchema = z.object({
  campaignName: z
    .string()
    .min(1, "Campaign name is required")
    .max(50, "Campaign name must be under 50 characters"),

  campaignType: z.enum(["OUT_OF_STOCK", "ALLWAYS", "IN_STOCK"], { error: "Campaign type is required" }),
  productTags: z.array(z.string()).nonempty("At least one product tag is required"),
  customerTags: z.array(z.string()).nonempty("At least one customer tag is required"),

  preOrderNoteKey: z.string().min(1, "Note key is required").max(30),
  preOrderNoteValue: z.string().min(1, "Note value is required").max(30),

  buttonText: z.string().min(1, "Button text is required").max(15, "Button text must be under 15 characters"),
  shippingMessage: z.string().min(1, "Shipping message is required").max(50, "Shipping message must be under 50 characters"),

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

  discountValue: z.coerce
      .number({
        error: "Discount value is required",
      })
      .min(0, "Discount value cannot be negative"),


  getPaymentsViaValtedPayments: z.boolean({
    error : "Please specify if vaulted payments are enabled" }),
}) .superRefine((data, ctx) => {
    if (data.discountType === "PERCENTAGE") {
      if (data.discountValue > 99) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountValue"],
          message: "Discount percentage must be below 100",
        });
      }
    }

    if (data.discountType === "FIXED") {
      if (data.discountValue > 999999) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountValue"],
          message: "Flat discount cannot be more than 6 digits",
        });
      }
    }
  });


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



export const EmailSettingsSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  font: z.string().min(1, "Font is required"),
  storeName: z.string().min(1, "Store name is required"),
  storeNameBold: z.boolean(),
  storeNameColor: z.string().min(1, "Store name color is required"),
  storeNameFontSize: z
    .string()
    .min(1, "Store name font size is required")
    .refine((val) => !isNaN(Number(val)), "Font size must be a number")
    .refine((val) => Number(val) > 0 && Number(val) < 50, "Font size must be between 1 and 50"),

  subheading: z.string().min(1, "Subheading is required"),
  subheadingFontSize: z
    .string()
    .min(1, "Subheading font size is required")
    .refine((val) => !isNaN(Number(val)), "Font size must be a number")
    .refine((val) => Number(val) > 0 && Number(val) < 50, "Font size must be between 1 and 50"),
  subheadingColor: z.string().min(1, "Subheading color is required"),
  subheadingBold: z.boolean(),

  description: z.string().min(1, "Description is required"),
  descriptionFontSize: z
    .string()
    .min(1, "Description font size is required")
    .refine((val) => !isNaN(Number(val)), "Font size must be a number")
    .refine((val) => Number(val) > 0 && Number(val) < 50, "Font size must be between 1 and 50"),
  descriptionColor: z.string().min(1, "Description color is required"),
  descriptionBold: z.boolean(),

  productTitleFontSize: z
    .string()
    .min(1, "Product title font size is required")
    .refine((val) => !isNaN(Number(val)), "Font size must be a number")
    .refine((val) => Number(val) > 0 && Number(val) < 50, "Font size must be between 1 and 50"),
  productTitleColor: z.string().min(1, "Product title color is required"),
  productTitleBold: z.boolean(),

  preorderText: z.string().min(1, "Preorder text is required"),
  fullPaymentText: z.string().min(1, "Full payment text is required"),
  partialPaymentText: z.string().min(1, "Partial payment text is required"),

  paymentTextFontSize: z
    .string()
    .min(1, "Payment text font size is required")
    .refine((val) => !isNaN(Number(val)), "Font size must be a number")
    .refine((val) => Number(val) > 0 && Number(val) < 50, "Font size must be between 1 and 50"),
  paymentTextColor: z.string().min(1, "Payment text color is required"),
  paymentTextBold: z.boolean(),
});