import { Elysia } from "elysia";
import { normalizeError } from "../../lib/http";
import { isAdminAuthorized } from "../../lib/security";
import { categoryIdParams, createCategoryBody, updateCategoryBody } from "./model";
import type { CategoriesService } from "./service";

export type CategoriesServiceContract = Pick<
  CategoriesService,
  "list" | "getById" | "create" | "update" | "remove"
>;

export function createCategoriesModule(categoriesService: CategoriesServiceContract) {
  return new Elysia({ prefix: "/categories" })
    .get("/", async ({ set }) => {
      try {
        const data = await categoriesService.list();
        return { data };
      } catch (error) {
        set.status = 500;
        return normalizeError(error);
      }
    })
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const data = await categoriesService.getById(params.id);
          if (!data) {
            set.status = 404;
            return { error: "Category not found." };
          }

          return { data };
        } catch (error) {
          set.status = 500;
          return normalizeError(error);
        }
      },
      { params: categoryIdParams },
    )
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const data = await categoriesService.create(body);
          set.status = 201;
          return { data };
        } catch (error) {
          set.status = 400;
          return normalizeError(error);
        }
      },
      { body: createCategoryBody },
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

        if (!body.name && body.description === undefined) {
          set.status = 400;
          return { error: "Provide at least one field to update." };
        }

        try {
          const data = await categoriesService.update(params.id, body);
          if (!data) {
            set.status = 404;
            return { error: "Category not found." };
          }

          return { data };
        } catch (error) {
          set.status = 400;
          return normalizeError(error);
        }
      },
      {
        params: categoryIdParams,
        body: updateCategoryBody,
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
          const didDelete = await categoriesService.remove(params.id);
          if (!didDelete) {
            set.status = 404;
            return { error: "Category not found." };
          }

          return { data: { id: params.id, deleted: true } };
        } catch (error) {
          set.status = 409;
          return { error: "Cannot delete category while it still has items." };
        }
      },
      { params: categoryIdParams },
    );
}
