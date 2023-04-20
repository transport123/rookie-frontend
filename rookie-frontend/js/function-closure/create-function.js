let functions=[]
function loopCreate()
{
    let arr=["one","two","three"]
	for(let i =0;i<arr.length;i++)
        {
            console.log(i)
            var vitem= arr[i]
            let litem= arr[i]
            functions.push(function()
            {
             	console.log(vitem)
                console.log(litem)
            })
        }
	    
}
loopCreate()
console.log(functions)
functions.forEach(print=>print())
