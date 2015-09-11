start
  = orExpr

orExpr
  = left:andExpr _ "|" _ right:orExpr { return {logicOp: "or", left: left, right: right}; }
  / andExpr

andExpr
  = left:queryExpr _ "&" _ right:andExpr { return {logicOp: "and", left: left, right: right}; }
  / queryExpr

queryExpr
  = id:identifier _ op:operator _ v:value { return {queryOp: op, field: id, value: v}; }
  / "(" _ expr:orExpr _ ")" { return expr; }

identifier
  = first:alpha rest:alphanumeric* { return first + rest.join(""); }

operator
  = "=="
  / "!=" { error("operator != not yet implemented"); }
  / "~~" { error("operator ~~ not yet implemented"); }
  / "|~" { error("operator |~ not yet implemented"); }
  / "~|" { error("operator ~| not yet implemented"); }

value
  = stringValue
  / numericValue

stringValue
  = '"' value:[^"]* '"' { return value.join(""); }
  / "'" value:[^']* "'" { return value.join(""); }

numericValue
  = [0-9]* ("." [0-9]*)? ("e" [0-9]+)? { return Number(text()); }

alpha
  = [a-zA-Z]

alphanumeric
  = [a-zA-Z0-9]

_
  = [ \t\n\r]*
