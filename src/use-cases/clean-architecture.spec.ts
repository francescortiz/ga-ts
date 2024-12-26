/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, expect, it } from "@jest/globals";
import { Option, Result, Some } from "..";
import { Err, Ok } from "../result";
import { Task } from "../task";

describe("Clean architecture controller", () => {
    class DbError extends Error {}

    class UnhandledError extends Error {}

    type Entity = { id: number };

    // Repository
    const getEntities = ({ id }: { id: number }) => {
        const getRowsFromDatabase = ({ id }: { id: number }) => {
            if (id) return Promise.resolve({ id } as Entity);
            else return Promise.reject(new DbError());
        };
        const getRowsTask = Task(getRowsFromDatabase, (err: unknown) =>
            err instanceof DbError ? err : new UnhandledError("", { cause: err }),
        );

        const mapEntityToDto = (e: Entity) => ({
            idDto: e.id,
        });

        return getRowsTask({ id }).map(mapEntityToDto);
    };

    // Use case
    class IdNotValidError extends Error {}

    class DependencyError extends Error {}

    type UseCaseError = IdNotValidError | DependencyError | UnhandledError;

    it("repository to controller flow", async () => {
        const getEntitiesUseCase = (id: Option<number>) =>
            id
                .toResult()
                .mapError(() => new IdNotValidError())
                .flatMap((id) => (id > 0 ? Ok(id) : Err(new IdNotValidError())))
                .flatMap((id) =>
                    getEntities({ id }).mapError((err) =>
                        err instanceof DbError
                            ? new DependencyError()
                            : new UnhandledError("", { cause: err }),
                    ),
                )
                .flatMap((entity) =>
                    getEntities({ id: entity.idDto }).mapError((err) =>
                        err instanceof DbError
                            ? new DependencyError()
                            : new UnhandledError("", { cause: err }),
                    ),
                )
                .map((entity): { idSync: number } => ({
                    idSync: entity.idDto,
                }));

        // Controller

        const getEntitiesController = async ({ id }: { id: number }) => {
            const result: Result<{ idSync: number }, UseCaseError> = await getEntitiesUseCase(
                Some(id),
            );

            if (result.ok) {
                return { 200: result.value };
            } else {
                return { 500: result.error };
            }
        };

        const r = await getEntitiesController({ id: 1 });

        expect(r).toEqual({ 200: { idSync: 1 } });
    });
});
