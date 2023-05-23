import { getA } from "./a.js";
console.log("functionb")
console.log(getA())
const func="functionB"
setTimeout(()=>{
  console.log(getA())
},3000)

export default{func}