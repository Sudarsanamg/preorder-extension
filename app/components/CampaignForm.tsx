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
  Checkbox,
  Popover,
  DatePicker,
  Link,
} from "@shopify/polaris";
import {
  DiscountIcon,
  CashDollarIcon,
  ClockIcon,
  CalendarCheckIcon,
} from "@shopify/polaris-icons";
import { CampaignFields } from "app/types/type";

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
}) => {
  return (
    <div style={{ flex: 1 }}>
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
        />
        <div style={{ marginTop: 6 }}>
          <p>This is only visible for you</p>
        </div>
        <div>
          <Text as="h4" variant="headingSm">
            Preorder
          </Text>
        </div>
        {/* <LegacyStack vertical> */}
        <RadioButton
          label="Show Preorder when product is out of stock"
          checked={campaignData.campaignType === 1}
          id="preorder"
          name="preorder"
          onChange={() => {
            // setSelectedOption(1);
            handleCampaignDataChange("campaignType", 1);
          }}
        />
        {campaignData.campaignType === 1 && (
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
          checked={campaignData.campaignType === 2}
          id="always-preorder"
          name="always-preorder"
          onChange={() => {
            // setSelectedOption(2);
            handleCampaignDataChange("campaignType", 2);
          }}
        />
        {campaignData.campaignType === 2 && (
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
          checked={campaignData.campaignType === 3}
          id="back-in-stock"
          name="back-in-stock"
          onChange={() => {
            // setSelectedOption(3);
            handleCampaignDataChange("campaignType", 3);
          }}
        />
        {campaignData.campaignType === 3 && (
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
        {/* </LegacyStack> */}
        {/* </div> */}
      </Card>

      <div style={{ marginTop: 20 }}>
        <Card>
          <Text as="h4" variant="headingSm">
            Preorder Button
          </Text>
          <TextField
            id="preorderButtonText"
            label="Button Text"
            placeholder="Enter button text"
            autoComplete="off"
            value={campaignData.buttonText}
            onChange={(e) => handleCampaignDataChange("buttonText", e)}
          />
          <TextField
            id="preorderMessage"
            label="Message"
            placeholder="Enter message"
            value={campaignData.shippingMessage}
            onChange={(e) => handleCampaignDataChange("shippingMessage", e)}
            autoComplete="off"
          />
        </Card>
      </div>

      {/* discount */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <BlockStack gap={"300"}>
            <Text as="h4" variant="headingSm">
              Discount
            </Text>
            {/* <Text as="p" variant="bodyMd">
                        Only works with{" "}
                        <Link to="https://help.shopify.com/en/manual/payments/shopify-payments">
                          Shopify Payments
                        </Link>{" "}
                      </Text> */}
            <InlineStack gap="400">
              <ButtonGroup variant="segmented">
                <Button
                  pressed={activeButtonIndex === 0}
                  onClick={() => handleButtonClick(0)}
                  icon={DiscountIcon}
                ></Button>
                <Button
                  pressed={activeButtonIndex === 1}
                  onClick={() => handleButtonClick(1)}
                  icon={CashDollarIcon}
                ></Button>
              </ButtonGroup>
              <TextField
                suffix={activeButtonIndex === 0 ? "%" : "$"}
                id="discount"
                type="text"
                value={
                  activeButtonIndex === 0
                    ? campaignData.discountPercentage.toString()
                    : campaignData.flatDiscount.toString()
                }
                onChange={(val) => {
                  if (isNaN(Number(val))) return;
                  if (activeButtonIndex === 0) {
                    handleCampaignDataChange("discountPercentage", Number(val));
                  } else {
                    handleCampaignDataChange("flatDiscount", Number(val));
                  }
                }}
              />
            </InlineStack>
            {(activeButtonIndex === 0 && campaignData.discountPercentage < 0) ||
            campaignData.discountPercentage >= 100 ? (
              <Text as="p" variant="bodyMd" tone="critical">
                Please enter valid discount percentage between 0 and 99
              </Text>
            ) : null}

            <Text as="p" variant="bodyMd">
              Can't see discount/strike through price?{" "}
              <Link to="https://help.shopify.com/en/manual/payments/shopify-payments">
                Contact support
              </Link>
            </Text>
          </BlockStack>
        </Card>
      </div>

      {/* preorder Note */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <Text as="h4" variant="headingSm">
            Preorder note
          </Text>
          <p>Visible in cart, checkout, transactional emails</p>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <TextField
              id="preorderNote"
              label="Preorder Note Key"
              autoComplete="off"
              value={campaignData.preOrderNoteKey}
              onChange={(e) => handleCampaignDataChange("preOrderNoteKey", e)}
            />
            <TextField
              id="preorderNote"
              label="Preorder Note Key"
              autoComplete="off"
              value={campaignData.preOrderNoteValue}
              onChange={(e) => handleCampaignDataChange("preOrderNoteValue", e)}
            />
          </div>
        </Card>
      </div>

      {/* payment type */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <Text as="h4" variant="headingSm">
            Payment
          </Text>
          <div>
            {/* <LegacyStack vertical> */}
            <BlockStack gap={"300"}>
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
                        suffix={` ${campaignData.partialPaymentType === "percent" ? "%" : "$"} as inital payment`}
                        value={campaignData.partialPaymentPercentage}
                        onChange={(val) => {
                          if (isNaN(Number(val))) return;
                          handleCampaignDataChange(
                            "partialPaymentPercentage",
                            val,
                          );
                        }}
                        error={
                          Number(campaignData.partialPaymentPercentage) <= 0 ||
                          Number(campaignData.partialPaymentPercentage) > 99
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
                          value={campaignData.paymentAfterDays}
                          onChange={(e) =>
                            handleCampaignDataChange("paymentAfterDays", e)
                          }
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
                  <div style={{ marginTop: 10, marginBottom: 10 }}>
                    {shopifyPaymentsEnabled && (
                      <Checkbox
                        label="Get Due payments via Valted credit cards Note:Works only with Shopify Payments"
                        checked={campaignData.getPaymentsViaValtedPayments}
                        onChange={() =>
                          handleCampaignDataChange(
                            "getPaymentsViaValtedPayments",
                            !campaignData.getPaymentsViaValtedPayments,
                          )
                        }
                      />
                    )}
                  </div>
                  <TextField
                    autoComplete="off"
                    label="Partial payment text"
                    onChange={(value) =>
                      handleCampaignDataChange("partialPaymentText", value)
                    }
                    value={campaignData.partialPaymentText}
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
          <Text as="h4" variant="headingSm">
            Campaign End Date and Time
          </Text>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
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
            <div>
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
          <Text as="h4" variant="headingSm">
            Set fulfilment status for orders with preorder items
          </Text>
          <BlockStack gap={"100"}>
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
                  <InlineStack gap="200">
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
                    <div style={{}}>
                      {campaignData.scheduledFullfillmentType === 1 && (
                        <TextField
                          label="Set to unfulfilled"
                          labelHidden
                          id="scheduledFullfillmentType"
                          autoComplete="off"
                          suffix="days after checkout"
                          value={campaignData.scheduledDays}
                          onChange={(value) =>
                            handleCampaignDataChange("scheduledDays", value)
                          }
                        />
                      )}
                      {campaignData.scheduledFullfillmentType === 2 && (
                        <div>
                          <Popover
                            active={popoverActive.fullfillmentSchedule}
                            activator={
                              // <div style={{ flex: 1 }}>
                              <TextField
                                label="Select date for fullfillment"
                                value={formatDate(
                                  selectedDates.fullfillmentSchedule)}
                                type="text"
                                onFocus={() => {
                                  togglePopover("fullfillmentSchedule");
                                }}
                                onChange={() => {}}
                                autoComplete="off"
                                labelHidden
                              />
                              // </div>
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
              Order tags
            </Text>
            <div onKeyDown={handleKeyDown}>
              <TextField
                label="Order Tags"
                value={productTagInput}
                onChange={(value) => setProductTagInput(value)}
                autoComplete="off"
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
      <div style={{ marginTop: 20 }}>
        <Card>
          <Button fullWidth onClick={() => setSelected(1)}>
            Continue to design
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CampaignForm;
