console.log("a loaded")
let a =10
let obj={name:"tom"}
setTimeout(()=>{
    a=100
    obj.name="jack"
},1000)
function getA()
{
    return a
}

export {a,obj,getA}