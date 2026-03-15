ALTER TABLE "items" ADD CONSTRAINT "items_price_cents_non_negative" CHECK ("items"."price_cents" >= 0);--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_quantity_non_negative" CHECK ("items"."quantity" >= 0);--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_reorder_level_non_negative" CHECK ("items"."reorder_level" >= 0);