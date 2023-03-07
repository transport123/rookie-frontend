## JS概览

1,尽量不要将js内嵌到html中，这样会污染html，且效率低下。例子：

```javascript
function createParagraph{
   	const para = document.createElement('p');
    para.textContent="don't do this!";
    document.body.appendChild(para);
}

<button onclick="createParagraph()"><button/>
```

js语句直接写进了html中，会使得代码混乱，且如果我们要给剩下的button设置事件不得不全部通过onclik赋值，这很麻烦

更好的做法：

```javascript
<script>
    const buttons = document.querySelectorAll('button');
	for(let i =0;i<buttons.length;i++)
    {
    	buttons[i].addeventlistener('click',createParagraph);
    }
</script>
```

**2,js的调用策略**

（由于html是按照流的方式顺序去加载，如果js脚本出现在其操控的元素之前，代码将会出错）

```javascript
//1 内部
document.addEventListener("DOMContentLoaded",function(){
    //dosth
})

//2 外部
<script src="xxx.js" async></script>
```

~~通过上述的两种方式来保证逻辑的正确性~~，DOMContentLoaded指html文档树加载完成后会触发的事件 即后面的function；

async指明遇到script标签时不要中断html的加载，脚本会和html一同加载 (async只对外部js文件有效)

(个人还是比较疑惑，async只是保证了不阻塞html后续内容的加载，似乎也无法保证脚本一定会在加载完后才执行，为什么就一定不会出错呢？)

DOMContentLoaded和以前将所有脚本都放在body最末端有着同样的缺点：必须等待所有html元素加载完毕后这些脚本才可以得到执行，可能会导致延迟较高的缺陷。

defer能保证不同脚本的顺序执行，并且看到一种说法defer虽然也是异步加载，但并不是加载完后马上执行，而是在dom树构建完后顺序执行，async则是谁先加载谁执行，这和Mozilla描述的 ：

- 如果脚本无需等待页面解析，且无依赖独立运行，那么应使用 `async`。
- 如果脚本需要等待页面解析，且依赖于其它脚本，调用这些脚本时应使用 `defer`，将关联的脚本按所需顺序置于 HTML 中。

较为一致

所以async并不是解决 “执行顺序” 的方案，原则上在脚本内部还是不要操作dom树，它的出现主要是解决阻塞问题，即加载js会阻塞html的解析，出现加载时间过长的问题 参考链接：https://segmentfault.com/q/1010000022143102 还是比较可信的

3，var与let的区别

```javascript
//var的变量提升特性使得只要在一个域内 用var声明变量，即使这个变量在赋值之后，也是有效的
vartype='vartype';
var vartype;
//这种写法用let是不行的，且这种写法只在脚本中有效，在console中也不行

//var 可以重复的定义变量
var duplicate = 1;
var duplicate = 2;
//let 同样不行
//可以的话尽量使用let，它减少了可能产生的语义不明，使得代码能够更加规范
```

4，数据类型

js中全都是对象吗？x 也是有6种基本类型的

js是动态语言，不需要指定类型，会自动推断类型。使用typeof可以看到当前类型

```javascript
let dog = {name:'doggie',type:'big',age:'number'};//定义对象的方式，暂时了解即可
```

要注意js种的数字全部都是Number类型，不分int float等

5，===与==

===表示值和类型都相等，==表示只需要值相等

6，字符串

```javascript
let string = "double quote";
let str = 'single quote';
//string需要用引号包裹，单双都可以，但请保持一致。
let containd='this will "work"';
let contains="this will 'work' too";
//如上所示不同的引号可以包裹，但是相同的不行，它会引起歧义
let fatalcontain='this won't work';
//该语句会报错 使用转移字符解决该问题
let contain = 'i\'m a good man';
```

字符串拼接使用+,数字在拼接时自动转成字符串；

```javascript
let mynum = 20;
let mystr = mynum.toString();
mystr++;
mynum=Number(mystr);
//数字与字符串的互转
```

字符串相关api：

```javascript
let stringapi='stringapi';
stringapi.length;
stringapi[0];
stringapi[stringapi.length-1];
stringapi.indexOf('api');//字符串匹配，将返回匹配的首字母位置，没有匹配的则返回-1;
stringapi.slice(0,3);//提取字符串，str 第一个参数表示起始位置，第二个参数为结束位置的后一个位置（不包含该位置)
//第二个参数可以不用，表示从0开始剩余的所有字符
stringapi.toLowerCase();
stringapi.toUpperCase();//大小写转换
stringapi=stringapi.replace('api','stringgg!');//注意可以不等长，且replace并不会真的改变原有string对象的值，需要重新赋值。猜测string在js中也是不可变对象，所以操作string返回的都是新对象。
//replace只会替换第一个找到的字符，replaceall会替换所有的
```

7，数组

```javascript
let arrstr=['ss','ss','gg'];
let random = ['ss',0,[9,10,20]];//js的数组可以混合类型
random[2][2];//20 数组包含数组的情况
arrstr.length;//3 长度
```

数组api：

```javascript
//数组与字符串的转换
let myData = 'Manchester,London,Liverpool,Birmingham,Leeds,Carlisle';
let myarr = myData.split(',');//通过,分割成数组
myData = myarr.join(',');//通过，与join函数将数组拼接成一个新的字符串
myData=myarr.toString();//虽然也是数组转为字符串，但是分隔符不可控
let newLength=myarr.push('scotland');//push向数组尾部加入新元素，并返回新数组的长度
let removedItem=myarr.pop();//pop删除数组尾部元素，并返回该删除的元素
//unshift对应push，shift对应pop 只不过它们针对的是数组的首部
```

8，条件语句

**任何不是null NaN undefined 0 false ”“的值都返回true，这一点要特别小心**

其余的点和Java几乎完全一致

9，循环

也和java几乎一致
