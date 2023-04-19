let a = 1
let obj = { name: "rose" }
setTimeout(() => {
    a = 20
    obj.name = "why"
}, 3000)

export default { a, obj }