import {a,obj} from './a.js'
import b from './b.js'
console.log(a)
console.log(obj)
console.log(b)

setTimeout(()=>{
    console.log(a)
    console.log(obj)
    console.log(b)

},4000)