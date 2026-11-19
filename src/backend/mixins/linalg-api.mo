import Types "../types/linalg";
import Linalg "../lib/linalg";

mixin () {
  /// Run a linear algebra calculation and return its result.
  public query func calculate(request : Types.CalcRequest) : async Types.CalcResult {
    Linalg.calculate(request);
  };
};
