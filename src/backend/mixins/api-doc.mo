mixin () {
  public query func getApiDoc() : async Text {
    "# Linear Algebra Library API\n" #
    "\n" #
    "## Purpose\n" #
    "\n" #
    "This canister exposes a single stateless computation endpoint, `calculate`, that performs core linear algebra operations on dense floating point matrices: determinant, inverse, transpose, rank, trace, addition, subtraction, matrix multiplication, scalar multiplication, solving a linear system `Ax = b`, and lasso-regularized linear regression. It stores no user data; every call is a pure function of its arguments.\n" #
    "\n" #
    "## Authentication and authorization\n" #
    "\n" #
    "`calculate` is a public `query` method. It requires no sign-in and no role: anonymous and signed-in callers are treated identically, and the method reads no caller identity. The canister also exposes the standard authorization mixin endpoints (`_initialize_access_control`, role management) used by the app's frontend; those are unrelated to the calculation API.\n" #
    "\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at `/.well-known/ii-derivation-origin` when available. An agent already holding the user's Internet Identity authorization derives the correct per-app principal against that origin (for example `icp identity link web <name> --app <host>`). Such a delegation acts with the user's full authority in this app until it expires.\n" #
    "\n" #
    "## Units and encoding\n" #
    "\n" #
    "- `Entry` is a Candid `float64` (Motoko `Float`).\n" #
    "- `Matrix` is `[[Entry]]`: an array of rows, each row an array of entries. Row-major order.\n" #
    "- `Vector` is `[Entry]`.\n" #
    "- `Operation` is a variant selecting the operation: `determinant`, `inverse`, `transpose`, `rank`, `trace`, `add`, `subtract`, `multiply`, `scalarMultiply`, `solve`, `lassoRegression`.\n" #
    "- `CalcRequest` fields: `operation` (required), `matrix` (required primary input), `matrixB` (optional second matrix for `add`/`subtract`/`multiply`), `scalar` (optional `Entry` for `scalarMultiply`), `vector` (optional right-hand side for `solve` and the response vector for `lassoRegression`), `lambda` (optional non-negative `Entry` regularization strength for `lassoRegression`; defaults to `0.0`).\n" #
    "- `CalcResult` is a variant: `#matrix([[Entry]])`, `#scalar(Entry)`, `#regression(RegressionFit)`, or `#error(Text)`.\n" #
    "- `RegressionFit` is a record: `coefficients` (`[Entry]`, one per feature column of X), `intercept` (`Entry`), `iterations` (`Nat`, solver iterations performed), `converged` (`Bool`, whether the convergence criterion was reached), and `residualSumOfSquares` (`Entry`).\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "`calculate` is synchronous and returns its result in the same call. There is no job, no polling, and no state transition to wait on. A `query` call is read-only and unreplicated, so it returns quickly.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "`calculate` performs no mutation and is fully idempotent: calling it repeatedly with the same request returns the same result. Retrying after a transport failure is always safe.\n" #
    "\n" #
    "## Errors and limits\n" #
    "\n" #
    "Undefined operations return `#error(Text)` rather than trapping. Cases include:\n" #
    "\n" #
    "- `determinant`, `inverse`, `trace`, `solve`: the primary matrix must be square.\n" #
    "- `inverse`: a singular matrix has no inverse.\n" #
    "- `solve`: a singular coefficient matrix has no unique solution, and the right-hand side vector length must equal the matrix dimension.\n" #
    "- `add`, `subtract`: both matrices must have identical dimensions.\n" #
    "- `multiply`: the left matrix column count must equal the right matrix row count.\n" #
    "- `lassoRegression`: the response vector length must equal the number of observations (rows of X), the regularization strength must be non-negative, and the design matrix must have at least one feature column.\n" #
    "- Any operation: every row of a matrix must have the same length.\n" #
    "\n" #
    "## Non-obvious gotchas\n" #
    "\n" #
    "- `rank` is returned as a `#scalar` whose value is the integer rank encoded as a float.\n" #
    "- `solve` returns the solution vector wrapped as a single-row matrix: `#matrix([x])`.\n" #
    "- `lassoRegression` fits coefficients and an intercept by coordinate descent with soft-thresholding. `matrix` is the design matrix X (rows = observations, columns = features), `vector` is the response vector y (one value per observation), and `lambda` is the non-negative L1 regularization strength. A feature column with zero variance (all entries equal) is not an error: its coefficient is reported as zero. The solver runs at most 1000 iterations and reports whether it converged.\n" #
    "- Floating point results are not rounded by the backend; the frontend applies consistent display rounding.\n" #
    "- A zero determinant is detected with a small tolerance (1e-9), so near-singular matrices may be reported as singular."
  };
};
