import { getA } from "./a.js";
console.log("function")
console.log(getA())
const func="function"

let sp=document.getElementById("tail")
console.log(sp)
setTimeout(()=>{
  console.log(getA())
},3000)
export {func}