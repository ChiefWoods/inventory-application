import { Elysia } from "elysia";
import { normalizeError } from "../../lib/http";
import { isAdminAuthorized } from "../../lib/security";
import { createItemBody, itemIdParams, listItemsQuery, updateItemBody } from "./model";
import { ItemsService } from "./service";

const itemsService = new ItemsService();

export const itemsModule = new Elysia({ prefix: "/items" })
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
      if (!isAdminAuthorized(headers["x-admin-password"])) {
        set.status = 401;
        return { error: "Admin password is required for update actions." };
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
      if (!isAdminAuthorized(headers["x-admin-password"])) {
        set.status = 401;
        return { error: "Admin password is required for delete actions." };
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
