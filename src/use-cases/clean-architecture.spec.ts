/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-constant-condition */
import { it } from "@jest/globals";
import { None, Some } from "src";
import { castErr } from "src/cast-error";
import { Err, Ok } from "src/result";
import { Task } from "src/task";

it("repository to controller flow", async () => {
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
            err instanceof DbError ? Err(err) : Err(new UnhandledError("", { cause: err })),
        );

        const mapEntityToDto = (e: Entity) => ({
            idDto: e.id,
        });

        const repositoryResult = getRowsTask({ id }).map(mapEntityToDto);
        return repositoryResult;
    };

    // Use case
    class IdNotValidError extends Error {}
    class DependencyError extends Error {}

    const getEntitiesUseCase = (id: number) => {
        // Maybe interesting function to export with a better name
        const optionFromUndefined = <T>(t: T | undefined) => (t ? Some(t) : None);

        const start = castErr(
            (id: number) => optionFromUndefined(id).toResult(),
            () => new IdNotValidError(),
        )(id);

        const useCaseResult = start
            .flatMap((id) => (id > 0 ? Ok(id) : Err(new IdNotValidError())))
            .flatMap(
                castErr(
                    (id) => getEntities({ id }),
                    (err) =>
                        err instanceof DbError
                            ? new DependencyError()
                            : new UnhandledError("", { cause: err }),
                ),
            )
            .flatMap(
                castErr(
                    (entity) => getEntities({ id: entity.idDto }),
                    (err) =>
                        err instanceof DbError
                            ? new DependencyError()
                            : new UnhandledError("", { cause: err }),
                ),
            );

        return useCaseResult;
    };

    // Controller

    const getEntitiesController = async ({ id }: { id: number }) => {
        const result = await getEntitiesUseCase(id);

        if (result.ok) {
            return { 200: result.value };
        } else {
            return { 500: result.error };
        }
    };

    const r = await getEntitiesController({ id: 1 });
    r;
});
