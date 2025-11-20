import React from "react";
import {
  Card,
  TextField,
  Text,
  RadioButton,
  Button,
  ButtonGroup,
  BlockStack,
  InlineStack,
  Tag,
  Popover,
  DatePicker,
  // Link,
} from "@shopify/polaris";
import {
  DiscountIcon,
  CashDollarIcon,
  ClockIcon,
  CalendarCheckIcon,
  // CalendarIcon,
} from "@shopify/polaris-icons";
import type { CampaignFields } from "app/types/type";
import '../styles/campaign.new.css';

interface CampaignFormProps {
  campaignData: CampaignFields;
  handleCampaignDataChange: <K extends keyof CampaignFields>(
    field: K,
    value: any,
  ) => void;
  handleRemoveTag: (index: number) => void;
  handleRemoveCustomerTag: (index: number) => void;
  selectedDates: any;
  handleDateChange: (key: string, range: any) => void;
  togglePopover: (key: string) => void;
  popoverActive: any;
  handleMonthChange: (month: number, year: number) => void;
  handleCampaignEndMonthChange: (month: number, year: number) => void;
  campaignEndPicker: any;
  month: number;
  year: number;
  plusStore: boolean;
  setSelected: (val: number) => void;
  setProductTagInput: (val: string) => void;
  setCustomerTagInput: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleKeyDownCustomerTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  productTagInput: string;
  customerTagInput: string;
  formatDate: (date: string) => string;
    activeButtonIndex: number;
  handleButtonClick: (index: number) => void;
  shopifyPaymentsEnabled: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  campaignData,
  handleCampaignDataChange,
  handleRemoveTag,
  handleRemoveCustomerTag,
  selectedDates,
  handleDateChange,
  togglePopover,
  popoverActive,
  handleMonthChange,
  handleCampaignEndMonthChange,
  campaignEndPicker,
  month,
  year,
  plusStore,
  setSelected,
  setProductTagInput,
  setCustomerTagInput,
  handleKeyDown,
  handleKeyDownCustomerTag,
  productTagInput,
  customerTagInput,
  formatDate,
  activeButtonIndex,
  handleButtonClick,
  shopifyPaymentsEnabled
}) => 
  {
  return (
    <div style={{ flex: 1.5  }} className="left" >
      <Card>
        <BlockStack>
          <Text as="h1" variant="headingLg">
            New Campaign
          </Text>
        </BlockStack>
        <TextField
          id="campaignName"
          label="Campaign Name"
          placeholder="Enter campaign name"
          autoComplete="off"
          value={campaignData.campaignName}
          onChange={(value) => {
            handleCampaignDataChange("campaignName", value);
          }}
          error={
            campaignData.campaignName.length > 50
              ? "Campaign name must be less than 50 characters"
              : ""
          }
        />
        <div style={{ marginTop: 6 }}>
          <p>This is only visible for you</p>
        </div>
        <div style={{ marginTop: 6 }}>
          <Text as="h4" variant="headingSm">
            Preorder
          </Text>
        </div>
        {/* <LegacyStack vertical> */}
        <BlockStack>
        <RadioButton
          label="Show Preorder when product is out of stock"
          checked={campaignData.campaignType === "OUT_OF_STOCK"}
          id="preorder"
          name="preorder"
          onChange={() => {
            handleCampaignDataChange("campaignType", "OUT_OF_STOCK");
          }}
        />
        {campaignData.campaignType === "OUT_OF_STOCK" && (
          <ol>
            <li>
              The Preorder button appears when stock reaches 0 and switches to
              "Add to cart" once inventory is replenished.
            </li>
            <li>
              When the campaign is active, the app enables "Continue selling
              when out of stock" and "Track quantity".
            </li>
          </ol>
        )}
        <RadioButton
          label="Always show Preorder button"
          checked={campaignData.campaignType === "ALWAYS"}
          id="always-preorder"
          name="always-preorder"
          onChange={() => {
            // setSelectedOption(2);
            handleCampaignDataChange("campaignType", "ALWAYS");
          }}
        />
        {campaignData.campaignType === "ALWAYS" && (
          <ol>
            <li>
              The Preorder button is displayed at all times, regardless of
              stock.
            </li>
            <li>
              When the campaign is active, the app enables "Continue selling
              when out of stock" and "Track quantity".
            </li>
          </ol>
        )}
        <RadioButton
          label="Show Preorder only when product in stock"
          checked={campaignData.campaignType === "IN_STOCK"}
          id="back-in-stock"
          name="back-in-stock"
          onChange={() => {
            handleCampaignDataChange("campaignType", "IN_STOCK");
          }}
        />
        {campaignData.campaignType === "IN_STOCK" && (
          <ol>
            <li>
              The Preorder button appears when stock is available and disappears
              when stock reaches 0 (switching to “Sold out”).
            </li>
            <li>
              The app enables "Track quantity" when the campaign is active but
              makes no changes when the campaign is turned off or deleted.
            </li>
          </ol>
        )}
        </BlockStack>
        {/* </LegacyStack> */}
        {/* </div> */}
      </Card>

      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ marginBottom: 10 }}>
            <Text as="h4" variant="headingSm">
              Preorder Button
            </Text>
          </div>
          <TextField
            id="preorderButtonText"
            label="Button Text"
            placeholder="Enter button text"
            autoComplete="off"
            value={campaignData.buttonText}
            onChange={(e) => handleCampaignDataChange("buttonText", e)}
            error={
              campaignData.buttonText.length === 0
                ? "Button text is required"
                : campaignData.buttonText.length > 15
                  ? "Button text must be less than 15 characters"
                  : ""
            }
          />
          <TextField
            id="preorderMessage"
            label="Message"
            placeholder="Enter message"
            value={campaignData.shippingMessage}
            onChange={(e) => handleCampaignDataChange("shippingMessage", e)}
            autoComplete="off"
            error={
              campaignData.shippingMessage.length === 0
                ? "Message is required"
                : campaignData.shippingMessage.length > 50
                  ? "Message must be less than 50 characters"
                  : ""
            }
          />
        </Card>
      </div>

      {/* discount */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <BlockStack gap={"400"}>
            <Text as="h4" variant="headingSm">
              Discount
            </Text>

            <InlineStack gap="400" wrap={false}>
              <div style={{ flexShrink: 0 }}>
                <ButtonGroup variant="segmented">
                  <Button
                    pressed={activeButtonIndex === 0}
                    onClick={() => handleButtonClick(0)}
                    icon={DiscountIcon}
                  />
                  <Button
                    pressed={activeButtonIndex === 1}
                    onClick={() => {
                      handleCampaignDataChange("discountValue", 0);
                      handleButtonClick(1);
                    }}
                    icon={CashDollarIcon}
                  />
                </ButtonGroup>
              </div>

              <div style={{ flex: 1 }}>
                <TextField
                  suffix={activeButtonIndex === 0 ? "%" : "$"}
                  autoComplete="off"
                  label="Discount"
                  labelHidden
                  id="discount"
                  type="text"
                  value={campaignData.discountValue.toString()}
                  onChange={(val) => {
                    if (String(val).length > 7) return;
                    if (isNaN(Number(val))) return;
                    handleCampaignDataChange("discountValue", Number(val));
                  }}
                  error={
                    campaignData.discountType === "PERCENTAGE"
                      ? campaignData.discountValue < 0 ||
                        campaignData.discountValue > 99
                        ? "Please enter  discount percentage between 0 and 99"
                        : ""
                      : campaignData.discountType === "FIXED"
                        ? String(campaignData.discountValue).length > 6
                          ? "Please enter valid discount amount less than 6 digits"
                          : ""
                        : ""
                  }
                />
              </div>
            </InlineStack>

            <Text as="p" variant="bodyMd" tone="base">
              Enter discount that to be applied on this campaign products.
              {/* <Link url="https://help.shopify.com/en/manual/payments/shopify-payments">
                Contact support
              </Link> */}
            </Text>
          </BlockStack>
        </Card>
      </div>

      {/* {(campaignData.discountType === 'PERCENTAGE') && (campaignData.discountValue < 0 ||
            campaignData.discountValue >= 100) ? (
              <Text as="p" variant="bodyMd" tone="critical">
                Please enter valid discount percentage between 0 and 99
              </Text>
            ) : campaignData.discountType === 'FIXED'  &&
              String(campaignData.discountValue).length > 6 ? (
              <Text as="p" variant="bodyMd" tone="critical">
                Please enter valid discount amount less than 6 digits
              </Text>
            ) : null} */}

      {/* preorder Note */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ marginBottom: 10 }}>
            <Text as="h4" variant="headingSm">
              Preorder Note
            </Text>
          </div>
          <p>Visible in cart, checkout, transactional emails</p>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <TextField
              id="preorderNote"
              label="Preorder Note Key"
              autoComplete="off"
              value={campaignData.preOrderNoteKey}
              onChange={(e) => handleCampaignDataChange("preOrderNoteKey", e)}
              error={
                campaignData.preOrderNoteKey.length === 0
                  ? "Preorder note key is required"
                  : campaignData.preOrderNoteKey.length > 20
                    ? "Preorder note key must be less than 20 characters"
                    : ""
              }
            />
            <TextField
              id="preorderNote"
              label="Preorder Note Value"
              autoComplete="off"
              value={campaignData.preOrderNoteValue}
              onChange={(e) => handleCampaignDataChange("preOrderNoteValue", e)}
              error={
                campaignData.preOrderNoteValue.length === 0
                  ? "Preorder note value is required"
                  : campaignData.preOrderNoteValue.length > 20
                    ? "Preorder note value must be less than 20 characters"
                    : ""
              }
            />
          </div>
        </Card>
      </div>

      {/* payment type */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ marginBottom: 10 }}>
            <Text as="h4" variant="headingSm">
              Payment
            </Text>
          </div>
          <div>
            {/* <LegacyStack vertical> */}
            <BlockStack gap={"100"}>
              <RadioButton
                label="Full payment"
                checked={campaignData.paymentMode === "full"}
                id="full-payment"
                name="full-payment"
                onChange={() => handleCampaignDataChange("paymentMode", "full")}
              />
              {campaignData.paymentMode === "full" && (
                <>
                  <TextField
                    id="fullPaymentNote"
                    autoComplete="off"
                    label="Full payment text"
                    onChange={(e) =>
                      handleCampaignDataChange("fullPaymentText", e)
                    }
                    value={campaignData.fullPaymentText}
                    error={
                      campaignData.fullPaymentText.length === 0
                        ? "Full payment text is required"
                        : campaignData.fullPaymentText.length > 50
                          ? "Full payment text must be less than 50 characters"
                          : ""
                    }
                  />
                  <Text as="p" variant="bodyMd">
                    Visible in cart, checkout, transactional emails
                  </Text>
                </>
              )}
              <RadioButton
                label="Partial payment"
                id="partial-payment"
                name="partial-payment"
                checked={campaignData.paymentMode === "partial"}
                onChange={() =>
                  handleCampaignDataChange("paymentMode", "partial")
                }
              />
              {campaignData.paymentMode === "partial" && (
                <div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div>
                      <ButtonGroup variant="segmented">
                        <Button
                          pressed={
                            campaignData.partialPaymentType === "percent"
                          }
                          onClick={() =>
                            handleCampaignDataChange(
                              "partialPaymentType",
                              "percent",
                            )
                          }
                          icon={DiscountIcon}
                        ></Button>
                        {/* <Button
                                  pressed={partialPaymentType === "flat"}
                                  onClick={() => setPartialPaymentType("flat")}
                                  icon={CashDollarFilledIcon}
                                  aria-label="Flat payment"
                                ></Button> */}
                      </ButtonGroup>
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextField
                        autoComplete="off"
                        label="Partial payment"
                        labelHidden
                        suffix={` ${campaignData.partialPaymentType === "percent" ? "%" : "$"} as inital payment`}
                        value={Number(
                          campaignData.partialPaymentPercentage,
                        ).toString()}
                        onChange={(val) => {
                          if (String(val).length > 7) return;
                          if (isNaN(Number(val))) return;
                          handleCampaignDataChange(
                            "partialPaymentPercentage",
                            val,
                          );
                        }}
                        error={
                          (campaignData.partialPaymentType === "percent" &&
                            Number(campaignData.partialPaymentPercentage) <=
                              0) ||
                          Number(campaignData.partialPaymentPercentage) > 99
                            ? "Please enter valid percentage between 1 and 99"
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 15,
                      display: "flex",
                      gap: 10,
                      alignContent: "center",
                      alignItems: "center",
                      alignSelf: "center",
                    }}
                  >
                    <div>
                      <ButtonGroup variant="segmented">
                        <Button
                          pressed={campaignData.duePaymentType === 1}
                          onClick={() =>
                            handleCampaignDataChange("duePaymentType", 1)
                          }
                          icon={ClockIcon}
                        ></Button>
                        <Button
                          pressed={campaignData.duePaymentType === 2}
                          onClick={() =>
                            handleCampaignDataChange("duePaymentType", 2)
                          }
                          icon={CalendarCheckIcon}
                        ></Button>
                      </ButtonGroup>
                    </div>
                    <div style={{}}>
                      {campaignData.duePaymentType === 1 && (
                        <TextField
                          id="partialPaymentNote"
                          autoComplete="off"
                          suffix="days after checkout"
                          value={Number(
                            campaignData.paymentAfterDays,
                          ).toString()}
                          onChange={(e) => {
                            if (String(e).length > 7) return;
                            handleCampaignDataChange("paymentAfterDays", e);
                          }}
                          label="Payment after days"
                          labelHidden
                        />
                      )}

                      {campaignData.duePaymentType === 2 && (
                        <div>
                          <Popover
                            active={popoverActive.duePaymentDate}
                            activator={
                              // <div style={{ flex: 1 }}>
                              <TextField
                                label="Select date for due payment"
                                // value={DueDateinputValue}
                                value={formatDate(selectedDates.duePaymentDate)}
                                onFocus={() => togglePopover("duePaymentDate")}
                                onChange={() => {}}
                                autoComplete="off"
                                labelHidden
                                prefix={"Due on "}
                              />
                              // </div>
                            }
                            onClose={() => togglePopover("duePaymentDate")}
                          >
                            <DatePicker
                              month={month}
                              year={year}
                              onChange={(range) =>
                                handleDateChange("duePaymentDate", range)
                              }
                              onMonthChange={handleMonthChange}
                              selected={{
                                start:
                                  selectedDates.duePaymentDate ??
                                  new Date(selectedDates.duePaymentDate),
                                end:
                                  selectedDates.duePaymentDate ??
                                  new Date(selectedDates.duePaymentDate),
                              }}
                              disableDatesBefore={
                                new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </Popover>
                        </div>
                      )}
                    </div>
                  </div>
                  <TextField
                    autoComplete="off"
                    label="Partial payment text"
                    onChange={(value) =>
                      handleCampaignDataChange("partialPaymentText", value)
                    }
                    value={campaignData.partialPaymentText}
                    error={
                      campaignData.partialPaymentText.length > 50
                        ? "Partial payment text cannot exceed 50 characters"
                        : campaignData.partialPaymentText.length === 0
                          ? "This field cannot be empty"
                          : ""
                    }
                  />
                  <Text as="p" variant="bodyMd">
                    Visible in cart, checkout, transactional emails
                  </Text>
                  <div style={{ marginTop: 10 }}>
                    <BlockStack gap="200">
                      <TextField
                        autoComplete="off"
                        label="Text"
                        value={campaignData.partialPaymentInfoText}
                        onChange={(value) =>
                          handleCampaignDataChange(
                            "partialPaymentInfoText",
                            value,
                          )
                        }
                        error={
                          campaignData.partialPaymentInfoText.length === 0
                            ? "This field cannot be empty"
                            : ""
                        }
                      />
                      <Text as="p" variant="bodyMd">
                        Use {"{payment}"} and {"{remaining}"} to display partial
                        payment amounts and {"{date}"} for full amount charge
                        date.
                      </Text>
                    </BlockStack>
                  </div>
                </div>
              )}
              {/* </LegacyStack> */}
            </BlockStack>
          </div>
        </Card>
      </div>
      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ marginBottom: 10 }}>
            <Text as="h4" variant="headingSm">
              Campaign End Date and Time
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, flexShrink: 0 }}>
              <Popover
                active={popoverActive.campaignEndDate}
                activator={
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Select end date"
                      // value={campaignEndPicker.inputValue}
                      value={formatDate(
                        selectedDates.campaignEndDate.toLocaleDateString(
                          "en-CA",
                        ),
                      )}
                      // onFocus={toggleCampaignEndPopover}
                      onFocus={() => togglePopover("campaignEndDate")}
                      onChange={() => {}}
                      autoComplete="off"
                    />
                  </div>
                }
                onClose={() => togglePopover("campaignEndDate")}
              >
                <DatePicker
                  month={campaignEndPicker.month}
                  year={campaignEndPicker.year}
                  onChange={(range) =>
                    handleDateChange("campaignEndDate", range)
                  }
                  onMonthChange={handleCampaignEndMonthChange}
                  selected={{
                    start: selectedDates.campaignEndDate,
                    end: selectedDates.campaignEndDate,
                  }}
                  disableDatesBefore={new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </Popover>
            </div>
            <div
              onKeyDown={(e) => {
                e.preventDefault();
              }}
            >
              <TextField
                id="campaignEndTime"
                autoComplete="off"
                type="time"
                label="Time"
                placeholder="Select time"
                value={campaignData.campaignEndTime}
                onChange={(value) =>
                  handleCampaignDataChange("campaignEndTime", value)
                }
                error={
                  campaignData.campaignEndTime.length === 0
                    ? "Select valid time"
                    : ""
                }
              />
            </div>
          </div>
          <Text as="p" variant="bodyMd">
            Campaign will end at the selected date and time.
          </Text>
        </Card>
      </div>
      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ marginBottom: 10 }}>
            <Text as="h4" variant="headingSm">
              Set fulfilment status for orders with preorder items
            </Text>
          </div>
          <BlockStack gap={"050"}>
            <RadioButton
              label="Unfulfilled"
              checked={campaignData.fulfilmentMode === "UNFULFILED"}
              id="unfulfilled"
              name="unfulfilled"
              onChange={() =>
                handleCampaignDataChange("fulfilmentMode", "UNFULFILED")
              }
            />
            <RadioButton
              label="Scheduled"
              checked={campaignData.fulfilmentMode === "SCHEDULED"}
              id="Scheduled"
              name="Scheduled"
              onChange={() =>
                handleCampaignDataChange("fulfilmentMode", "SCHEDULED")
              }
            />
            {campaignData.fulfilmentMode === "SCHEDULED" && (
              <div
                style={{
                  paddingLeft: 20,
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <BlockStack gap={"200"}>
                  <Text as="p" variant="bodyMd">
                    Only works with Shopify Payments
                  </Text>
                  <Text as="h5" variant="bodySm">
                    Automatically change to unfulfiled:
                  </Text>
                  <InlineStack gap="200" wrap={false}>
                    <ButtonGroup variant="segmented">
                      <Button
                        pressed={campaignData.scheduledFullfillmentType === 1}
                        onClick={() =>
                          // setScheduledFullfillmentType(1)
                          handleCampaignDataChange(
                            "scheduledFullfillmentType",
                            1,
                          )
                        }
                        icon={ClockIcon}
                      ></Button>
                      <Button
                        pressed={campaignData.scheduledFullfillmentType === 2}
                        onClick={() =>
                          // setScheduledFullfillmentType(2)
                          handleCampaignDataChange(
                            "scheduledFullfillmentType",
                            2,
                          )
                        }
                        icon={CalendarCheckIcon}
                      ></Button>
                    </ButtonGroup>
                    <div
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {campaignData.scheduledFullfillmentType === 1 && (
                        <TextField
                          label="Set to unfulfilled"
                          labelHidden
                          id="scheduledFullfillmentType"
                          autoComplete="off"
                          suffix="days after checkout"
                          value={Number(campaignData.scheduledDays).toString()}
                          onChange={(value) => {
                            if (String(value).length > 5) return;
                            handleCampaignDataChange("scheduledDays", value);
                          }}
                        />
                      )}
                      {campaignData.scheduledFullfillmentType === 2 && (
                        <div>
                          <Popover
                            active={popoverActive.fullfillmentSchedule}
                            activator={
                              <div style={{ flex: 1 }}>
                                <TextField
                                  label="Select date for fullfillment"
                                  value={formatDate(
                                    selectedDates.fullfillmentSchedule,
                                  )}
                                  type="text"
                                  onFocus={() => {
                                    togglePopover("fullfillmentSchedule");
                                  }}
                                  onChange={() => {}}
                                  autoComplete="off"
                                  labelHidden
                                />
                              </div>
                            }
                            onClose={() => {
                              togglePopover("fullfillmentSchedule");
                            }}
                          >
                            <DatePicker
                              month={month}
                              year={year}
                              onChange={(range) =>
                                handleDateChange("fullfillmentSchedule", range)
                              }
                              onMonthChange={handleMonthChange}
                              selected={{
                                start: selectedDates.fullfillmentSchedule,
                                end: selectedDates.fullfillmentSchedule,
                              }}
                              disableDatesBefore={
                                new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </Popover>
                        </div>
                      )}
                    </div>
                  </InlineStack>
                </BlockStack>
              </div>
            )}
            <RadioButton
              label="On Hold"
              checked={campaignData.fulfilmentMode === "ONHOLD"}
              id="onhold"
              name="onhold"
              onChange={() =>
                handleCampaignDataChange("fulfilmentMode", "ONHOLD")
              }
            />
          </BlockStack>
        </Card>
      </div>
      <div style={{ marginTop: 20 }}>
        <Card>
          <BlockStack gap={"200"}>
            <Text as="h4" variant="headingSm">
              Order Tags
            </Text>
            <div onKeyDown={handleKeyDown}>
              <TextField
                label="Order Tags"
                value={productTagInput}
                onChange={(value) => setProductTagInput(value)}
                autoComplete="off"
                helpText="Press enter to add tag"
              />
            </div>
            <Text as="h4" variant="headingSm">
              For customers who placed preorders
            </Text>
            <div>
              {campaignData.productTags.map((tag, index) => (
                <div
                  key={index}
                  style={{
                    display: "inline-block",
                    marginRight: 10,
                    marginTop: 5,
                  }}
                >
                  <Tag key={index}>
                    {tag}
                    <button
                      style={{
                        // backgroundColor: "gray",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        padding: 5,
                        border: "none",
                      }}
                      onClick={() => handleRemoveTag(index)}
                    >
                      X
                    </button>
                  </Tag>
                </div>
              ))}
            </div>
          </BlockStack>
        </Card>
      </div>
      <div style={{ marginTop: 20 }}>
        <Card>
          <BlockStack gap={"200"}>
            <Text as="h4" variant="headingSm">
              Customer tags
            </Text>
            <div onKeyDown={handleKeyDownCustomerTag}>
              <TextField
                label="Customer Tags"
                value={customerTagInput}
                onChange={(value) => setCustomerTagInput(value)}
                autoComplete="off"
                helpText="Press enter to add tag"
              />
            </div>
            <Text as="h4" variant="headingSm">
              For customers who placed preorders
            </Text>
            <div>
              {campaignData.customerTags.map((tag, index) => (
                <div
                  key={index}
                  style={{ display: "inline-block", marginRight: 10 }}
                >
                  <Tag key={index}>
                    {tag}
                    <button
                      style={{
                        // backgroundColor: "gray",
                        background: "transparent",
                        padding: 5,
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        handleRemoveCustomerTag(index);
                      }}
                    >
                      X
                    </button>
                  </Tag>
                </div>
              ))}
            </div>
          </BlockStack>
        </Card>
      </div>
      <div className="campaign-form-footer">
        <Button onClick={() => setSelected(1)} variant="primary">
          Next
        </Button>
      </div>
    </div>
  );
};

export default CampaignForm;


