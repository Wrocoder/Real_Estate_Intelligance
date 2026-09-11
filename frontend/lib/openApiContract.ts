import type { components, operations } from "./generated-api";

type Schemas = components["schemas"];

export type ApiSchema<Name extends keyof Schemas> = Schemas[Name];

export type WithRequired<Shape, Keys extends keyof Shape> = Omit<Shape, Keys> & {
  [Key in Keys]-?: Exclude<Shape[Key], undefined>;
};

export type CompareRequestContract = NonNullable<
  operations["compare_listings_api_v1_compare_post"]["requestBody"]
>["content"]["application/json"];

export type SaveBuyerProfileRequestContract = NonNullable<
  operations["save_my_buyer_profile_api_v1_me_buyer_profile_put"]["requestBody"]
>["content"]["application/json"];
