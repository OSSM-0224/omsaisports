const fs = require("fs");
const f = fs.readdirSync("dist/assets").find(x => x.endsWith(".js"));
const p = "dist/assets/" + f;
let s = fs.readFileSync(p, "utf8");
const a = 'catch{Cn()}const Xe=new ResizeObserver';
const b = 'catch(e){console.warn("SH_ERR",e&&e.message);Cn()}const Xe=new ResizeObserver';
const c = 'const Cn=()=>{Mt.dataset.gl="off"}';
const d = 'const Cn=()=>{console.warn("SH_FAIL",new Error().stack);Mt.dataset.gl="off"}';
if (!s.includes(a) || !s.includes(c)) { console.log("pattern missing", s.includes(a), s.includes(c)); process.exit(1); }
s = s.replace(a, b).replace(c, d);
fs.writeFileSync(p, s);
console.log("patched", p);
