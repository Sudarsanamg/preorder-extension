import { DiscountType } from "@prisma/client";

export interface DesignFields {
  messageFontSize: string;
  messageColor: string;
  fontFamily: string;
  buttonBackgroundColor: string;
  borderSize: string;
  borderColor: string;
  spacingIT: string;
  spacingIB: string;
  spacingOT: string;
  spacingOB: string;
  preorderMessageColor: string;
  buttonStyle: string;
  gradientDegree: string;
  gradientColor1: string;
  gradientColor2: string;
  borderRadius: string;
  buttonFontSize: string;
  buttonTextColor: string;
}

export interface CampaignFields {
    campaignName: string;
    campaignType: 1 | 2 | 3;
  productTags: string[];
  customerTags: string[];
  preOrderNoteKey: string;
  preOrderNoteValue: string;
  buttonText: string;
  shippingMessage: string;
  partialPaymentPercentage: string;
  paymentMode: 'full' | 'partial';
  partialPaymentType: 'percent' | 'flat';
  duePaymentType: 1 | 2;
  campaignEndTime: string;
  fulfilmentMode: 'UNFULFILED' | 'SCHEDULED' | 'ONHOLD';
  scheduledFullfillmentType: 1 | 2;
  scheduledDays: string;
  paymentAfterDays: string;
  fullPaymentText: string;
  partialPaymentText: string;
  partialPaymentInfoText: string;
  discountType: DiscountType;
  discountPercentage: number;
  flatDiscount: number;
  getPaymentsViaValtedPayments: boolean;
}


export interface EmailSettings {
  subject: string;
  font: string;
  storeName: string;
  storeNameBold : boolean;
  storeNameColor: string;
  storeNameFontSize: string;
  subheading: string;
  subheadingFontSize: string;
  subheadingColor: string;
  subheadingBold: boolean;
  description: string;
  descriptionFontSize: string;
  descriptionColor: string;
  descriptionBold: boolean;
  productTitleFontSize: string;
  productTitleColor: string;
  productTitleBold: boolean;
  preorderText: string;
  fullPaymentText: string;
  partialPaymentText: string;
  paymentTextFontSize: string;
  paymentTextColor: string;
  paymentTextBold: boolean;
  showCancelButton : boolean;
  cancelButtonStyle : string;
  cancelButtonText: string;
  cancelButtonFontSize: string;
  cancelButtonTextColor: string;
  cancelButtonBold: boolean;
  cancelButtonBackgroundColor: string;
  cancelButtonBorderSize: string;
  cancelButtonBorderColor: string;
  cancelButtonGradientDegree: string;
  cancelButtonGradientColor1: string;
  cancelButtonGradientColor2: string;
  cancelButtonBorderRadius: string;

}