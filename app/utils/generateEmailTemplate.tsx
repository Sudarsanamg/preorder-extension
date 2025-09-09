export function generateEmailTemplate(emailSettings: any) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${emailSettings.subject || "Preorder Confirmation"}</title>
  </head>
  <body style="margin:0; padding:0; font-family:${emailSettings.font || "Arial, sans-serif"}; background-color:#f7f7f7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7; padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:12px; padding:20px;">
            
            <!-- Store Name -->
            <tr>
              <td align="center" style="font-size:${emailSettings.storeNameFontSize}px; font-weight:${emailSettings.storeNameBold ? "bold" : "normal"}; color:${emailSettings.storeNameColor}; padding-bottom:10px;">
                ${emailSettings.storeName}
              </td>
            </tr>

            <!-- Subheading -->
            <tr>
              <td align="center" style="font-size:${emailSettings.subheadingFontSize}px; font-weight:${emailSettings.subheadingBold ? "bold" : "normal"}; color:${emailSettings.subheadingColor}; padding-bottom:15px;">
                ${emailSettings.subheading}
              </td>
            </tr>

            <!-- Description -->
            <tr>
              <td align="left" style="font-size:${emailSettings.descriptionFontSize}px; font-weight:${emailSettings.descriptionBold ? "bold" : "normal"}; color:${emailSettings.descriptionColor}; line-height:22px; padding-bottom:20px;">
                ${emailSettings.description}
              </td>
            </tr>

            <!-- Product Section -->
            <tr>
              <td>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="100" valign="top">
                      <img src="${emailSettings.productImage}" alt="Product Image" width="80" style="border-radius:8px; display:block;" />
                    </td>
                    <td valign="top" style="padding-left:10px;">
                      <div style="font-size:${emailSettings.productTitleFontSize}px; font-weight:${emailSettings.productTitleBold ? "bold" : "normal"}; color:${emailSettings.productTitleColor}; padding-bottom:5px;">
                        ${emailSettings.productTitle}
                      </div>
                      <div style="font-size:14px; color:#555555; line-height:20px;">
                        ${emailSettings.preorderText}
                      </div>
                      <div style="font-size:14px; color:#555555; line-height:20px;">
                        ${emailSettings.fullPaymentText}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Cancel Button -->
            ${
              emailSettings.showCancelButton
                ? `
            <tr>
              <td align="center" style="padding-top:20px;">
                <a href="${emailSettings.cancelUrl}" 
                   style="
                     display:inline-block;
                     font-size:${emailSettings.cancelButtonFontSize}px;
                     font-weight:${emailSettings.cancelButtonBold ? "bold" : "normal"};
                     color:${emailSettings.cancelButtonTextColor};
                     text-decoration:none;
                     padding:8px 16px;
                     border-radius:${emailSettings.cancelButtonBorderRadius}px;
                     border:${emailSettings.cancelButtonBorderSize}px solid ${emailSettings.cancelButtonBorderColor};
                     background:${emailSettings.cancelButtonStyle === "single" ? emailSettings.cancelButtonBackgroundColor : ""};
                     background:${emailSettings.cancelButtonStyle === "gradient" ? `linear-gradient(${emailSettings.cancelButtonGradientDegree}deg, ${emailSettings.cancelButtonGradientColor1}, ${emailSettings.cancelButtonGradientColor2})` : ""};
                   ">
                  Cancel order ${emailSettings.orderId}
                </a>
              </td>
            </tr>`
                : ""
            }

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
