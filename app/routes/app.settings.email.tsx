// import {
//   BlockStack,
//   Card,
//   Page,
//   Text,
//   LegacyStack,
//   RadioButton,
//   InlineStack,
//   TextField,
// } from "@shopify/polaris";
// import { useState, useCallback, useEffect } from "react";
// import {SaveBar, useAppBridge} from '@shopify/app-bridge-react';
// import { json, useLoaderData ,useSubmit } from "@remix-run/react";
// import { authenticate } from "../shopify.server";
// import prisma from "app/db.server";

// export const loader = async ({ request }: { request: Request }) => {
//   const {admin } = await authenticate.admin(request);
//    const query = `{
//       shop {
//         id
//         name
//         myshopifyDomain
//       }
//     }`;
  
//     const response = await admin.graphql(query);
//     const data = await response.json();
//     const shopId = data.data.shop.id;

//     // const emailConfig = await prisma.emailConfig.findUnique({
//     //   where: { storeId: shopId },
//     // });
//     const emailConfig = {
//       fromName: "preorder",
//       fromEmail: "info@essentialspreorder.com",
//       replyName: "preorder",
//     };
    

//     return {shopId ,emailConfig};
// }

// export const action = async ({ request }: { request: Request }) => {
//   const { admin } = await authenticate.admin(request);

//   const formData = await request.formData();
//   const fromName = formData.get('fromName') as string;
//   const fromEmail = formData.get('fromEmail') as string;
//   const replyName = formData.get('replyName') as string;
//   const storeId = formData.get('storeId') as string;


//   await prisma.emailConfig.upsert({
//     where: { storeId },
//     update: {
//       fromName,
//       replyName
//      },
//     create: {
//       storeId,
//       fromName,
//       senderType: "main",
//       replyName
//     },
//   });

//   return json({ success: true });
// }


// export default function SettingsEmail() {
//   const {shopId ,emailConfig} = useLoaderData();
//   console.log(shopId);
//   console.log(emailConfig);
//   const [formData, setFormData] = useState({
//     fromName: emailConfig?.fromName || "preorder",
//     fromEmail: "info@essentialspreorder.com",
//     replyName: emailConfig?.replyName || "preorder",
//   })
//   const [value, setValue] = useState("main");

//   const shopify = useAppBridge();
//   const submit = useSubmit();
//   const handleSave = () => {
//   const fd = new FormData(); // <-- renamed
//   fd.append("intent", "save-email-settings");
//   fd.append("storeId", String(shopId));
//   fd.append("fromName", formData.fromName);
//   fd.append("fromEmail", formData.fromEmail);
//   fd.append("replyName", formData.replyName);
//   submit(fd, { method: "post" });
//   shopify.saveBar.hide('my-save-bar');
//   };

//   const handleDiscard = () => {
//     console.log('Discarding');
//     shopify.saveBar.hide('my-save-bar');
//   };

//   const handleChange = useCallback(
//     (_: boolean, newValue: string) => setValue(newValue),
//     [],
//   );

//   const [fromName,setFromName] = useState("preorder");

//   useEffect(()=>{
//     shopify.saveBar.show('my-save-bar');
//   },[formData]);

//   return (
//     <Page
//       title="Customize Sender Email"
//       backAction={{ content: "Back", url: "/app/" }}
//     >
//       <SaveBar id="my-save-bar">
//         <button variant="primary" onClick={handleSave}></button>
//         <button onClick={handleDiscard}></button>
//       </SaveBar>
//       <Card >
//         <BlockStack gap={"400"}>
//           <Text variant="headingMd" as="h2">
//             Sender email
//           </Text>
//           <Text variant="bodyMd" as="h2">
//             All transactional preorder emails will be sent from this address.
//           </Text>
//           <Card>
//             <RadioButton
//               label="info@essentialspreorder.com"
//               checked={value === "main"}
//               id="main"
//               name="main"
//               onChange={handleChange}
//             />
//             {
//                 value === "main" && (
//                     <InlineStack gap={"400"} align="space-around">
//                         <TextField
//                             type="text"
//                             value={formData.fromName}
//                             onChange={(value)=>{
//                                 setFormData({
//                                     ...formData,
//                                     fromName:value
//                                 })
//                             }}
//                             label="From name"
//                             autoComplete="off"
//                         />
//                         <TextField
//                             type="text"
//                             value="info@essentialspreorder.com"
//                             readOnly
//                             label="From email"
//                             autoComplete="off"
//                             disabled
//                         />
//                         <TextField
//                             type="text"                            
//                             label="Reply-to name"
//                             value={formData.replyName}
//                             onChange={(value)=>{
//                                 setFormData({
//                                     ...formData,
//                                     replyName:value
//                                 })
//                             }}
//                             autoComplete="off"
//                             placeholder="Reply-to name"
//                         />
//                     </InlineStack>
//                 )
//             }
//           </Card>
//           {/* <Card>
//             <RadioButton
//               label="Custom"
//               checked={value === "custom"}
//               id="custom"
//               name="custom"
//               onChange={handleChange}
//             />

//             {
//                 value === "custom" && (
//                     <div style={{padding:5}}>
//                     <Text variant="bodyMd" as="p">When you add your email, we generate DNS records for you to add to your domain provider in order to authenticate your domain and improve email deliverability. Learn how to setup.</Text>
//                     <InlineStack gap={"400"} align="space-around" >
//                         <TextField
//                             type="text"
//                             label="From name"
//                             autoComplete="off"
//                             value={fromName}
//                             onChange={setFromName}
//                         />
//                         <TextField
//                             type="text"
//                             label="From email"
//                             autoComplete="off"
//                             placeholder="info@email.com"
//                         />
//                         <TextField
//                             type="text"
//                             label="Reply-to name"
//                             autoComplete="off"
//                             placeholder="Reply-to name"
//                         />
//                     </InlineStack>
//                     </div>
//                 )
//             }
//           </Card> */}
//         </BlockStack>
//       </Card>
//     </Page>
//   );
// }
