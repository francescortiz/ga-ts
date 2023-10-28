export type Some<T> = {
    some: true;
    value: T;
};

export type None = {
    some: false;
    value: never;
};

export type Option<T> = Some<T> | None;

export const Some = <T>(value: T): Some<T> => ({
    some: true,
    value,
});

export const None: None = {
    some: false,
    value: undefined as never,
};
