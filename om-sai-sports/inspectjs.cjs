const fs = require("fs");
const f = fs.readdirSync("dist/assets").find(x => x.endsWith(".js"));
const s = fs.readFileSync("dist/assets/" + f, "utf8");
let i = -1;
while ((i = s.indexOf('gl="off"', i + 1)) >= 0) {
  console.log("---", i);
  console.log(s.slice(Math.max(0, i - 250), i + 250));
}
