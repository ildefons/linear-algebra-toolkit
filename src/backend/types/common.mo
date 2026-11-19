module {
  /// A matrix entry is a floating point number.
  public type Entry = Float;

  /// A dense matrix represented as a list of rows, each row a list of entries.
  public type Matrix = [[Entry]];

  /// A vector of floating point numbers (used as a right-hand side).
  public type Vector = [Entry];
};
