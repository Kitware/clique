q = require("./query");
a = 'field1 == "roni" & field2 == "rupa" | field3 == "rashad" & field4 == 15 | field5 == 7';
r = q.parse(a);
console.log(r);
