import('./a.js').then((exports)=>{
    console.log(exports)
    console.log(exports.a)
})

const b=90
export {b}