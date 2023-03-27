let timeOutTask =new Promise((resolve,reject)=>{
    setTimeout(()=>resolve(1),5000)
}).then((val)=>{
    let innerPromise = new Promise((resolve,reject)=>{
        
        let innestPromise = new Promise((resolvein)=>{
            setTimeout(()=>resolvein(15),5000)
        })
        resolve(innestPromise)
        console.log(val)
    })
    return innerPromise;
}).then((val)=>{
    console.log(val)
})