import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CalcRequest {
    scalar?: Entry;
    lambda?: Entry;
    matrixB?: Matrix;
    vector?: Vector;
    operation: Operation;
    matrix: Matrix;
}
export type CalcResult = {
    __kind__: "scalar";
    scalar: Entry;
} | {
    __kind__: "regression";
    regression: RegressionFit;
} | {
    __kind__: "error";
    error: string;
} | {
    __kind__: "matrix";
    matrix: Matrix;
};
export interface Cell {
    value: Value;
    name: string;
}
export type Entry = number;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Matrix = Array<Array<Entry>>;
export interface RegressionFit {
    intercept: Entry;
    coefficients: Vector;
    iterations: bigint;
    converged: boolean;
    residualSumOfSquares: Entry;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type Vector = Array<Entry>;
export enum Operation {
    add = "add",
    trace = "trace",
    determinant = "determinant",
    inverse = "inverse",
    rank = "rank",
    transpose = "transpose",
    solve = "solve",
    multiply = "multiply",
    lassoRegression = "lassoRegression",
    scalarMultiply = "scalarMultiply",
    subtract = "subtract"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Run a linear algebra calculation and return its result.
     */
    calculate(request: CalcRequest): Promise<CalcResult>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    schema(): Promise<string>;
}
