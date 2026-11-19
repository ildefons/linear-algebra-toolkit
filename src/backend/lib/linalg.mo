import Array "mo:core/Array";
import Types "../types/linalg";

module {
  /// Tolerance used when deciding whether a floating point value is zero.
  let EPSILON : Float = 1.0e-9;

  /// Number of rows in a matrix.
  func rows(m : Types.Matrix) : Nat = m.size();

  /// Number of columns in a matrix (0 for an empty matrix).
  func cols(m : Types.Matrix) : Nat {
    if (m.size() == 0) { 0 } else { m[0].size() };
  };

  /// True when every row has the same length.
  func isRectangular(m : Types.Matrix) : Bool {
    if (m.size() == 0) { return true };
    let width = m[0].size();
    var ok = true;
    for (row in m.values()) {
      if (row.size() != width) { ok := false };
    };
    ok;
  };

  /// Transpose a rectangular matrix.
  func transpose(m : Types.Matrix) : Types.Matrix {
    let r = rows(m);
    let c = cols(m);
    if (r == 0 or c == 0) { return [] };
    Array.tabulate(c, func(j) {
      Array.tabulate(r, func(i) { m[i][j] });
    });
  };

  /// Element-wise combination of two same-shaped matrices.
  func combine(a : Types.Matrix, b : Types.Matrix, f : (Float, Float) -> Float) : Types.Matrix {
    Array.tabulate(rows(a), func(i) {
      Array.tabulate(cols(a), func(j) { f(a[i][j], b[i][j]) });
    });
  };

  /// Matrix product of `a` (r x n) and `b` (n x c).
  func multiply(a : Types.Matrix, b : Types.Matrix) : Types.Matrix {
    let r = rows(a);
    let n = cols(a);
    let c = cols(b);
    Array.tabulate(r, func(i) {
      Array.tabulate(c, func(j) {
        var sum = 0.0;
        var k = 0;
        while (k < n) {
          sum += a[i][k] * b[k][j];
          k += 1;
        };
        sum;
      });
    });
  };

  /// Trace: sum of the diagonal entries of a square matrix.
  func trace(m : Types.Matrix) : Float {
    var sum = 0.0;
    var i = 0;
    let n = rows(m);
    while (i < n) {
      sum += m[i][i];
      i += 1;
    };
    sum;
  };

  /// Determinant via Gaussian elimination with partial pivoting.
  /// Returns `null` for a non-square matrix.
  func determinant(m : Types.Matrix) : ?Float {
    let n = rows(m);
    if (n != cols(m)) { return null };
    if (n == 0) { return ?1.0 };
    // Work on a mutable copy.
    let a = Array.tabulate(n, func(i) {
      Array.tabulate(n, func(j) { m[i][j] }).toVarArray();
    }).toVarArray();
    var det = 1.0;
    var i = 0;
    while (i < n) {
      // Partial pivot: find the row with the largest magnitude in column i.
      var pivot = i;
      var maxAbs = Float.abs(a[i][i]);
      var r = i + 1;
      while (r < n) {
        let v = Float.abs(a[r][i]);
        if (v > maxAbs) { maxAbs := v; pivot := r };
        r += 1;
      };
      if (maxAbs <= EPSILON) { return ?0.0 };
      if (pivot != i) {
        let tmp = a[i];
        a[i] := a[pivot];
        a[pivot] := tmp;
        det := -det;
      };
      det *= a[i][i];
      let pivotVal = a[i][i];
      var rr = i + 1;
      while (rr < n) {
        let factor = a[rr][i] / pivotVal;
        var cc = i;
        while (cc < n) {
          a[rr][cc] := a[rr][cc] - factor * a[i][cc];
          cc += 1;
        };
        rr += 1;
      };
      i += 1;
    };
    ?det;
  };

  /// Rank via row reduction (Gaussian elimination).
  func rank(m : Types.Matrix) : Nat {
    let r = rows(m);
    let c = cols(m);
    if (r == 0 or c == 0) { return 0 };
    let a = Array.tabulate(r, func(i) {
      Array.tabulate(c, func(j) { m[i][j] }).toVarArray();
    }).toVarArray();
    var rankCount = 0;
    var row = 0;
    var col = 0;
    while (row < r and col < c) {
      // Find a pivot in this column at or below `row`.
      var pivot = row;
      var maxAbs = Float.abs(a[row][col]);
      var rr = row + 1;
      while (rr < r) {
        let v = Float.abs(a[rr][col]);
        if (v > maxAbs) { maxAbs := v; pivot := rr };
        rr += 1;
      };
      if (maxAbs <= EPSILON) {
        col += 1;
      } else {
        if (pivot != row) {
          let tmp = a[row];
          a[row] := a[pivot];
          a[pivot] := tmp;
        };
        let pivotVal = a[row][col];
        var rr2 = row + 1;
        while (rr2 < r) {
          let factor = a[rr2][col] / pivotVal;
          var cc = col;
          while (cc < c) {
            a[rr2][cc] := a[rr2][cc] - factor * a[row][cc];
            cc += 1;
          };
          rr2 += 1;
        };
        rankCount += 1;
        row += 1;
        col += 1;
      };
    };
    rankCount;
  };

  /// Inverse via Gauss-Jordan elimination. Returns `null` for a non-square or
  /// singular matrix.
  func inverse(m : Types.Matrix) : ?Types.Matrix {
    let n = rows(m);
    if (n != cols(m)) { return null };
    if (n == 0) { return ?[] };
    // Augment with the identity.
    let a = Array.tabulate(n, func(i) {
      Array.tabulate(2 * n, func(j) {
        if (j < n) { m[i][j] } else if (j == n + i) { 1.0 } else { 0.0 };
      }).toVarArray();
    }).toVarArray();
    var i = 0;
    while (i < n) {
      // Partial pivot.
      var pivot = i;
      var maxAbs = Float.abs(a[i][i]);
      var r = i + 1;
      while (r < n) {
        let v = Float.abs(a[r][i]);
        if (v > maxAbs) { maxAbs := v; pivot := r };
        r += 1;
      };
      if (maxAbs <= EPSILON) { return null };
      if (pivot != i) {
        let tmp = a[i];
        a[i] := a[pivot];
        a[pivot] := tmp;
      };
      // Normalize the pivot row.
      let pivotVal = a[i][i];
      var cc = 0;
      while (cc < 2 * n) {
        a[i][cc] := a[i][cc] / pivotVal;
        cc += 1;
      };
      // Eliminate this column from every other row.
      var rr = 0;
      while (rr < n) {
        if (rr != i) {
          let factor = a[rr][i];
          var c2 = 0;
          while (c2 < 2 * n) {
            a[rr][c2] := a[rr][c2] - factor * a[i][c2];
            c2 += 1;
          };
        };
        rr += 1;
      };
      i += 1;
    };
    // Extract the right half.
    ?Array.tabulate(n, func(r2) {
      Array.tabulate(n, func(c2) { a[r2][n + c2] });
    });
  };

  /// Solve Ax = b for a square A. Returns `null` for a non-square or singular A.
  func solve(a : Types.Matrix, b : Types.Vector) : ?Types.Vector {
    let n = rows(a);
    if (n != cols(a)) { return null };
    if (b.size() != n) { return null };
    if (n == 0) { return ?[] };
    // Augment A with b.
    let m = Array.tabulate(n, func(i) {
      Array.tabulate(n + 1, func(j) {
        if (j < n) { a[i][j] } else { b[i] };
      }).toVarArray();
    }).toVarArray();
    var i = 0;
    while (i < n) {
      var pivot = i;
      var maxAbs = Float.abs(m[i][i]);
      var r = i + 1;
      while (r < n) {
        let v = Float.abs(m[r][i]);
        if (v > maxAbs) { maxAbs := v; pivot := r };
        r += 1;
      };
      if (maxAbs <= EPSILON) { return null };
      if (pivot != i) {
        let tmp = m[i];
        m[i] := m[pivot];
        m[pivot] := tmp;
      };
      let pivotVal = m[i][i];
      var cc = i;
      while (cc <= n) {
        m[i][cc] := m[i][cc] / pivotVal;
        cc += 1;
      };
      var rr = 0;
      while (rr < n) {
        if (rr != i) {
          let factor = m[rr][i];
          var c2 = i;
          while (c2 <= n) {
            m[rr][c2] := m[rr][c2] - factor * m[i][c2];
            c2 += 1;
          };
        };
        rr += 1;
      };
      i += 1;
    };
    ?Array.tabulate(n, func(r2) { m[r2][n] });
  };

  /// Soft-thresholding operator: sign(z) * max(|z| - lambda, 0).
  func softThreshold(z : Float, lambda : Float) : Float {
    if (z > lambda) { z - lambda } else if (z < -lambda) { z + lambda } else { 0.0 };
  };

  /// Fit a linear regression with L1 (lasso) regularization via coordinate
  /// descent. `x` is the design matrix (rows = observations, columns =
  /// features), `y` the response vector, and `lambda` the non-negative
  /// regularization strength. Returns `null` when the shapes are inconsistent.
  ///
  /// The solver centers each feature column and the response, fits the
  /// coefficients on the centered data, and recovers the intercept from the
  /// column means. Centering makes the update numerically stable when a column
  /// is constant (for example a leading column of ones): such a column has zero
  /// centered variance, so its coefficient is pinned to zero and the constant
  /// is absorbed by the intercept instead of oscillating against it.
  func lassoRegression(x : Types.Matrix, y : Types.Vector, lambda : Float) : ?Types.RegressionFit {
    let n = rows(x);
    let p = cols(x);
    if (y.size() != n) { return null };
    if (n == 0 or p == 0) { return null };
    let nf = n.toFloat();
    // Column means, used to center each feature.
    let colMean = Array.tabulate(p, func(j) {
      var s = 0.0;
      var i = 0;
      while (i < n) {
        s += x[i][j];
        i += 1;
      };
      s / nf;
    });
    // Mean of the response.
    var yMean = 0.0;
    var iy = 0;
    while (iy < n) {
      yMean += y[iy];
      iy += 1;
    };
    yMean := yMean / nf;
    // Centered design matrix and centered response.
    let xc = Array.tabulate(n, func(i) {
      Array.tabulate(p, func(j) { x[i][j] - colMean[j] });
    });
    let yc = Array.tabulate(n, func(i) { y[i] - yMean });
    // Squared norm of each centered feature column. A column whose centered
    // norm is (near) zero carries no variance, so its coefficient is pinned to
    // zero and skipped by the solver.
    let colNormSq = Array.tabulate(p, func(j) {
      var s = 0.0;
      var i = 0;
      while (i < n) {
        s += xc[i][j] * xc[i][j];
        i += 1;
      };
      s;
    });
    let degenerate = Array.tabulate(p, func(j) { colNormSq[j] <= EPSILON });
    let beta = Array.tabulate(p, func(_) { 0.0 }).toVarArray();
    var iterations = 0;
    var converged = false;
    let maxIterations = 1000;
    let tolerance = 1.0e-8;
    while (iterations < maxIterations and not converged) {
      var maxChange = 0.0;
      var j = 0;
      while (j < p) {
        if (degenerate[j]) {
          // Zero-variance column: coefficient stays zero.
          j += 1;
        } else {
          // Partial residual of the centered response excluding feature j.
          var rho = 0.0;
          var i = 0;
          while (i < n) {
            var pred = 0.0;
            var k = 0;
            while (k < p) {
              if (k != j) { pred += xc[i][k] * beta[k] };
              k += 1;
            };
            rho += xc[i][j] * (yc[i] - pred);
            i += 1;
          };
          let newBeta = softThreshold(rho, lambda) / colNormSq[j];
          let change = Float.abs(newBeta - beta[j]);
          if (change > maxChange) { maxChange := change };
          beta[j] := newBeta;
          j += 1;
        };
      };
      iterations += 1;
      if (maxChange <= tolerance) { converged := true };
    };
    // Recover the intercept from the centered fit: the model passes through the
    // means, so intercept = yMean - sum_j beta_j * colMean_j.
    var intercept = yMean;
    var jm = 0;
    while (jm < p) {
      intercept -= beta[jm] * colMean[jm];
      jm += 1;
    };
    // Residual sum of squares of the fitted model on the original scale.
    var rss = 0.0;
    var i3 = 0;
    while (i3 < n) {
      var pred = intercept;
      var k3 = 0;
      while (k3 < p) {
        pred += x[i3][k3] * beta[k3];
        k3 += 1;
      };
      let r = y[i3] - pred;
      rss += r * r;
      i3 += 1;
    };
    ?{
      coefficients = Array.tabulate(p, func(j) { beta[j] });
      intercept;
      iterations;
      converged;
      residualSumOfSquares = rss;
    };
  };

  /// Perform the requested linear algebra calculation.
  public func calculate(request : Types.CalcRequest) : Types.CalcResult {
    let m = request.matrix;
    if (not isRectangular(m)) {
      return #error("Matrix rows must all have the same length.");
    };
    switch (request.operation) {
      case (#determinant) {
        switch (determinant(m)) {
          case (?d) { #scalar(d) };
          case null { #error("Determinant requires a square matrix.") };
        };
      };
      case (#inverse) {
        switch (inverse(m)) {
          case (?inv) { #matrix(inv) };
          case null {
            if (rows(m) != cols(m)) {
              #error("Inverse requires a square matrix.");
            } else {
              #error("Matrix is singular and has no inverse.");
            };
          };
        };
      };
      case (#transpose) { #matrix(transpose(m)) };
      case (#rank) { #scalar(rank(m).toFloat()) };
      case (#trace) {
        if (rows(m) != cols(m)) {
          #error("Trace requires a square matrix.");
        } else {
          #scalar(trace(m));
        };
      };
      case (#add) {
        switch (request.matrixB) {
          case null { #error("Addition requires a second matrix.") };
          case (?b) {
            if (not isRectangular(b)) {
              #error("Second matrix rows must all have the same length.");
            } else if (rows(m) != rows(b) or cols(m) != cols(b)) {
              #error("Addition requires matrices of the same dimensions.");
            } else {
              #matrix(combine(m, b, func(x, y) { x + y }));
            };
          };
        };
      };
      case (#subtract) {
        switch (request.matrixB) {
          case null { #error("Subtraction requires a second matrix.") };
          case (?b) {
            if (not isRectangular(b)) {
              #error("Second matrix rows must all have the same length.");
            } else if (rows(m) != rows(b) or cols(m) != cols(b)) {
              #error("Subtraction requires matrices of the same dimensions.");
            } else {
              #matrix(combine(m, b, func(x, y) { x - y }));
            };
          };
        };
      };
      case (#multiply) {
        switch (request.matrixB) {
          case null { #error("Multiplication requires a second matrix.") };
          case (?b) {
            if (not isRectangular(b)) {
              #error("Second matrix rows must all have the same length.");
            } else if (cols(m) != rows(b)) {
              #error("Multiplication requires the left matrix column count to equal the right matrix row count.");
            } else {
              #matrix(multiply(m, b));
            };
          };
        };
      };
      case (#scalarMultiply) {
        switch (request.scalar) {
          case null { #error("Scalar multiplication requires a scalar value.") };
          case (?s) {
            #matrix(Array.tabulate(rows(m), func(i) {
              Array.tabulate(cols(m), func(j) { m[i][j] * s });
            }));
          };
        };
      };
      case (#solve) {
        switch (request.vector) {
          case null { #error("Solving Ax = b requires a right-hand side vector.") };
          case (?v) {
            switch (solve(m, v)) {
              case (?x) { #matrix([x]) };
              case null {
                if (rows(m) != cols(m)) {
                  #error("Solving Ax = b requires a square coefficient matrix.");
                } else if (v.size() != rows(m)) {
                  #error("Right-hand side vector length must equal the matrix dimension.");
                } else {
                  #error("Matrix is singular; the system has no unique solution.");
                };
              };
            };
          };
        };
      };
      case (#lassoRegression) {
        switch (request.vector) {
          case null { #error("Lasso regression requires a response vector.") };
          case (?v) {
            let lambda = request.lambda ?? 0.0;
            if (lambda < 0.0) {
              #error("Regularization strength must be non-negative.");
            } else {
              switch (lassoRegression(m, v, lambda)) {
                case (?fit) { #regression(fit) };
                case null {
                  if (v.size() != rows(m)) {
                    #error("Response vector length must equal the number of observations.");
                  } else {
                    #error("Lasso regression requires at least one feature column.");
                  };
                };
              };
            };
          };
        };
      };
    };
  };
};
