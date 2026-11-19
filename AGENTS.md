# Project Guidance

## User Preferences

- Wants a linear algebra library style tool: matrix input plus core matrix operations
- Results should be clearly labeled and consistently rounded
- Include a reference of the supported operations with worked examples

## Accepted Requirements

- A linear algebra library app
- A linear regression library with lasso regularization

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Tailwind v3 silently drops a color utility whose token is not registered in tailwind.config.js colors (e.g. text-success emitted no CSS though --success exists in index.css); register the color or use a registered token.
- Tailwind v3 opacity modifiers such as border-foreground/40 fail the production build unless the color token is registered with an <alpha-value> placeholder; use a token that is.
- Stateless compute canister: Expose({ entities = [] }) is correct; Data Intelligence entity/sample rows are not required when no field is persisted.
- Backend CalcResult is a __kind__ union (matrix|scalar|error); Operation is a generated value enum imported from @/backend.
- Biome noArrayIndexKey flags any key built from a map index; precompute {id,value} arrays before mapping grid cells.
- Motoko: Array.tabulate returns immutable [T]; build mutable rows with .toVarArray() and the outer array likewise for [var [var Float]]. Float.abs is a module function (Float.abs x), not a receiver method.
- Lasso coordinate descent must center features and fit the intercept separately; a constant column of ones collinear with the intercept makes the uncentered update diverge (coefficients around 2.9e+300).
- text-success/text-warning emit no CSS unless success/warning are registered in tailwind.config.js colors; the convergence color is silently dropped.
- RegressionFit is a generated interface imported with `import type` from @/backend; iterations is bigint and needs .toString().
- Biome noArrayIndexKey also flags key={`coef-${index}`}; precompute a {id,index,value} array before mapping coefficients.
- Motoko M0155 on Nat subtraction: rewrite j - n == i as j == n + i to avoid the inferred-trap warning.
- An embedded child component that auto-runs backend calls on mount pollutes a shared actor mock in the parent's tests; gate the auto-run on an `embedded` prop so standalone tests keep it.
- testing-library getByText matches hidden-by-CSS nodes, so a colliding child must be conditionally unmounted, not visually hidden.
- React Query mutation objects change identity each render; guard a mount-time auto-run with a ref so the effect does not loop.
- The inherited backend PocketIC lane has one pre-existing failing test (test/pocketic/backend.test.ts > fits lasso regression with coefficients close to the true relationship) that predates the regression demo work.
