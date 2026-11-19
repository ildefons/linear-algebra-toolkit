import Common "common";

module {
  public type Entry = Common.Entry;
  public type Matrix = Common.Matrix;
  public type Vector = Common.Vector;

  /// The operation to perform. The operation name selects which inputs are used.
  public type Operation = {
    #determinant;
    #inverse;
    #transpose;
    #rank;
    #trace;
    #add;
    #subtract;
    #multiply;
    #scalarMultiply;
    #solve;
    #lassoRegression;
  };

  /// A calculation request. `matrix` is the primary input; `matrixB` is the
  /// optional second matrix (add/subtract/multiply), `scalar` is the optional
  /// scalar (scalarMultiply), `vector` is the optional right-hand side
  /// (solve, Ax = b), and `lambda` is the optional non-negative regularization
  /// strength (lassoRegression).
  ///
  /// For `lassoRegression`, `matrix` is the design matrix X (rows =
  /// observations, columns = features), `vector` is the response vector y (one
  /// value per observation), and `lambda` is the non-negative L1
  /// regularization strength.
  public type CalcRequest = {
    operation : Operation;
    matrix : Matrix;
    matrixB : ?Matrix;
    scalar : ?Entry;
    vector : ?Vector;
    lambda : ?Entry;
  };

  /// The fitted result of a lasso-regularized linear regression.
  public type RegressionFit = {
    /// One fitted coefficient per feature (column of the design matrix X).
    coefficients : Vector;
    /// The fitted intercept term.
    intercept : Entry;
    /// Number of solver iterations performed.
    iterations : Nat;
    /// Whether the solver reached its convergence criterion.
    converged : Bool;
    /// Residual sum of squares of the fitted model.
    residualSumOfSquares : Entry;
  };

  /// The outcome of a calculation: a matrix, a scalar, a regression fit, or a
  /// clear error message when the operation is undefined for the given inputs.
  public type CalcResult = {
    #matrix : Matrix;
    #scalar : Entry;
    #regression : RegressionFit;
    #error : Text;
  };
};
