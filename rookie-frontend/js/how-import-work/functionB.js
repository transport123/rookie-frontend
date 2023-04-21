import { getA } from "./a.js";
console.log(getA())

setTimeout(()=>{
  console.log(getA())
},3000)