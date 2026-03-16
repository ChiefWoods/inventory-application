import { Elysia } from "elysia";
import { normalizeError } from "../../lib/http";
import { isAdminAuthorized } from "../../lib/security";
import { createItemBody, itemIdParams, listItemsQuery, updateItemBody } from "./model";
import type { ItemsService } from "./service";

export type ItemsServiceContract = Pick<
  ItemsService,
  "list" | "getById" | "create" | "update" | "remove"
>;

export function createItemsModule(itemsService: ItemsServiceContract) {
  return new Elysia({ prefix: "/items" })
    .get(
      "/",
      async ({ query, set }) => {
        try {
          const data = await itemsService.list({
            categoryId: query.categoryId,
            q: query.q,
            lowStock: query.lowStock === true,
          });
          return { data };
        } catch (error) {
          set.status = 500;
          return normalizeError(error);
        }
      },
      { query: listItemsQuery },
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const data = await itemsService.getById(params.id);
          if (!data) {
            set.status = 404;
            return { error: "Item not found." };
          }

          return { data };
        } catch (error) {
          set.status = 500;
          return normalizeError(error);
        }
      },
      { params: itemIdParams },
    )
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const data = await itemsService.create(body);
          set.status = 201;
          return { data };
        } catch (error) {
          set.status = 400;
          return normalizeError(error);
        }
      },
      { body: createItemBody },
    )
    .patch(
      "/:id",
      async ({ params, body, headers, set }) => {
        const adminPassword = headers["x-admin-password"];
        if (!adminPassword) {
          set.status = 401;
          return { error: "Admin password is required." };
        }
        if (!isAdminAuthorized(adminPassword)) {
          set.status = 401;
          return { error: "Admin password is incorrect." };
        }

        if (Object.keys(body).length === 0) {
          set.status = 400;
          return { error: "Provide at least one field to update." };
        }

        try {
          const data = await itemsService.update(params.id, body);
          if (!data) {
            set.status = 404;
            return { error: "Item not found." };
          }

          return { data };
        } catch (error) {
          set.status = 400;
          return normalizeError(error);
        }
      },
      {
        params: itemIdParams,
        body: updateItemBody,
      },
    )
    .delete(
      "/:id",
      async ({ params, headers, set }) => {
        const adminPassword = headers["x-admin-password"];
        if (!adminPassword) {
          set.status = 401;
          return { error: "Admin password is required." };
        }
        if (!isAdminAuthorized(adminPassword)) {
          set.status = 401;
          return { error: "Admin password is incorrect." };
        }

        try {
          const didDelete = await itemsService.remove(params.id);
          if (!didDelete) {
            set.status = 404;
            return { error: "Item not found." };
          }

          return { data: { id: params.id, deleted: true } };
        } catch (error) {
          set.status = 500;
          return normalizeError(error);
        }
      },
      { params: itemIdParams },
    );
}
