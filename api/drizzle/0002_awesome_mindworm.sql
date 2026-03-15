CREATE TABLE "coffee_specs" (
	"item_id" bigint NOT NULL,
	"origin_country" text NOT NULL,
	"region" text,
	"producer" text,
	"process" text,
	"roast_level" text NOT NULL,
	"tasting_notes" text,
	"altitude_meters" integer,
	"variety" text,
	"harvest_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coffee_specs_item_id_pk" PRIMARY KEY("item_id"),
	CONSTRAINT "coffee_specs_roast_level_check" CHECK ("coffee_specs"."roast_level" IN ('light', 'medium-light', 'medium', 'medium-dark', 'dark', 'espresso')),
	CONSTRAINT "coffee_specs_harvest_year_check" CHECK ("coffee_specs"."harvest_year" IS NULL OR ("coffee_specs"."harvest_year" >= 1900 AND "coffee_specs"."harvest_year" <= 2100)),
	CONSTRAINT "coffee_specs_altitude_meters_check" CHECK ("coffee_specs"."altitude_meters" IS NULL OR "coffee_specs"."altitude_meters" >= 0)
);
--> statement-breakpoint
CREATE TABLE "item_suppliers" (
	"item_id" bigint NOT NULL,
	"supplier_id" bigint NOT NULL,
	"supplier_sku" text,
	"lead_time_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_suppliers_item_id_supplier_id_pk" PRIMARY KEY("item_id","supplier_id"),
	CONSTRAINT "item_suppliers_lead_time_days_check" CHECK ("item_suppliers"."lead_time_days" IS NULL OR "item_suppliers"."lead_time_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "suppliers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"website_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coffee_specs" ADD CONSTRAINT "coffee_specs_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_item_suppliers_item_id" ON "item_suppliers" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_item_suppliers_supplier_id" ON "item_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_name_unique" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_suppliers_name" ON "suppliers" USING btree ("name");