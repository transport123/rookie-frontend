// 设置画布

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;
const pe=document.querySelector('p');
// 生成随机数的函数

function random(min,max) {
  const num = Math.floor(Math.random() * (max - min)) + min;
  return num;
}

function randomColor() {
  return 'rgb(' +
         random(0, 255) + ', ' +
         random(0, 255) + ', ' +
         random(0, 255) + ')';
}


function Shape(x,y,velx,vely,exists)
{
  this.x=x;
  this.y=y;
  this.velx=velx;
  this.vely=vely;
  this.exists=exists
  //坐标，两个方向的速度，大小，颜色
}

function Ball(x,y,velx,vely,size,color)
{
  Shape.call(this,x,y,velx,vely,true);//this!
  this.size=size;
  this.color=color;
}

function EvilCircle(x,y,exists,size,color){
  Shape.call(this,x,y,20,20,exists);
  this.size=size;
  this.color=color;
}

EvilCircle.prototype.draw=function()
{
  ctx.beginPath();
  ctx.lineWidth=3;
  ctx.strokeStyle=this.color;
  ctx.arc(this.x,this.y,size,0,Math.PI*2);
  ctx.stroke();
}

EvilCircle.prototype.checkBounds=function()
{
  if(this.x+this.size>=width) 
  {
    this.x=width-this.size-5;
  }
  if(this.x<=this.size)
  {
    this.x=this.size+5;
  }
  if(this.y+this.size>=height )
  {
    this.y=height-this.size-5;
  }

  if( this.y<=this.size)
  {
    this.y=this.size+5;
  }
}


EvilCircle.prototype.setControls=function(){
  window.onkeydown = e => {
    switch(e.key) {
      case 'a':
        this.x -= this.velx;
        break;
      case 'd':
        this.x += this.velx;
        break;
      case 'w':
        this.y -= this.vely;
        break;
      case 's':
        this.y += this.vely;
        break;
    }
  };
}


EvilCircle.prototype.collisionDetect=function()
{
  for(let i=0;i<balls.length;i++)
  {
    if(!balls[i].exists)
      continue;
    let dx = this.x-balls[i].x;
    let dy=this.y-balls[i].y;
    if(Math.sqrt(dx*dx+dy*dy)<(this.size+balls[i].size))
    {
      balls[i].exists=false;
      ballnumber--;
      pe.textContent=`还剩${ballnumber}个球`;
    }
  }
}

//通过原型对象给ball实例定义方法
Ball.prototype.draw=function(){
  ctx.beginPath()
  ctx.fillStyle=this.color;
  ctx.arc(this.x,this.y,this.size,0,2*Math.PI);
  ctx.fill();
}

//小球的坐标变换方法 简单的加上对应的速度
Ball.prototype.update=function(){
  //如果变换后的位置超出了屏幕，就将小球弹回（超出可能有四个方向，所以有四个判断，弹回即速度反向改变）
  if(this.x+this.size>=width || this.x<=this.size)
  {
    this.velx=-this.velx;
  }
  if(this.y+this.size>=height || this.y<=this.size)
  {
    this.vely=-this.vely;
  }
  this.x+=this.velx;
  this.y+=this.vely;
}


//创建所有的小球
let balls=[];
while(balls.length<25){
let size = random(10,40);
let ball=new Ball(random(size,width-size),
random(size,height-size),
random(-5,5),
random(-5,5),
size,
randomColor());
balls.push(ball);
}
let ballnumber = balls.length;
pe.textContent=`还剩${ballnumber}个球`;

//创建恶魔圈
let size = random(10,40);
let evilcircle=new EvilCircle(random(size,width-size),
random(size,height-size),true,20,'white');
evilcircle.setControls();

//循环每一帧
function loop()
{
  //在每一帧画球前将整个canvas用黑色背景填满，这样就看不到小球运动的轨迹了
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, width, height);

  evilcircle.checkBounds();
  evilcircle.draw();
  evilcircle.collisionDetect();

  for(const ball of balls)
  {
    if(ball.exists){
      ball.collapse();
      ball.draw();
      ball.update();
    }
  }
  requestAnimationFrame(loop);
}

Ball.prototype.collapse=function(){
  let index = balls.indexOf(this);

  for(let i=0;i<balls.length;i++)
  {

    if(index===i)
    {
      continue;
    }
   

    let dx = this.x-balls[i].x;
    let dy=this.y-balls[i].y;
    if(Math.sqrt(dx*dx+dy*dy)<(this.size+balls[i].size)&&balls[i].exists)
    {
      this.color=balls[i].color=randomColor();
      
    }
  }
}

loop();