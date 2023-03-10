const displayedImage = document.querySelector('.displayed-img');
const thumbBar = document.querySelector('.thumb-bar');

const btn = document.querySelector('button');
const overlay = document.querySelector('.overlay');

/* Declaring the array of image filenames */
let myimages=['images/pic1.jpg','images/pic2.jpg','images/pic3.jpg','images/pic4.jpg','images/pic5.jpg']
/* Declaring the alternative text for each image file */
let myalts=['eyes','seas','flowers','drawing','butterfly']

/* Looping through images */
for(let i=0;i<myimages.length;i++)
{
    const newImage = document.createElement('img');
    newImage.setAttribute('src', myimages[i]);
    newImage.setAttribute('alt', myalts[i]);
    newImage.onclick=clickImg;
    thumbBar.appendChild(newImage);
}
btn.onclick=darkandlight;
function clickImg(e)
{
    displayedImage.setAttribute('src',e.target.getAttribute('src'));
}

/* Wiring up the Darken/Lighten button */

function darkandlight()
{
    if(btn.textContent.trim()==="Darken")
    {
        
        btn.textContent='Lighten';
        overlay.style.backgroundColor='rgba(0,0,0,0.5)';
    }else if(btn.textContent==='Lighten')
    {
        btn.textContent='Darken';
        overlay.style.backgroundColor='rgba(0,0,0,0)';
    }//少加了个else导致程序无论如何都会执行两个判断...无语!
}