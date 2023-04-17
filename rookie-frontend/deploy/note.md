## npm7+ install时的依赖冲突

### 依赖类型

**tips:关于依赖是否会根据dev打进包里有两个说法，一个说法是dev中的依赖不会被打进包中，只会将dependencies中的依赖打入包中；一个说法webpack是会根据引用树自动将使用的库打进包中**

dependencies:

运行时所需要的依赖



devDependencies:

开发时所需要的依赖（如code format，test调试等）



从定义上似乎很好理解，但又容易出现偏差。目前觉得比较靠谱的理解：

1，（仅限webpack）项目构建过程是否将某个依赖打进包中和这两个值无关，是根据入口文件的引用树决定，也就是用到的依赖会被打包进去，这样才保证程序的正确运行；

2，在对顶层项目直接执行npm install时，默认会下载所有的依赖，--production会标识为生产环境，仅下载dependencies中的依赖；

3，如果是开发的lib模块提供给别人使用，devDependencies中的依赖不会被链式下载，所以如果是开发一个库这就很重要，因为我们不希望别人在使用我们的库时，将我们在开发库时的开发依赖也链式下载下来，这样会造成纯粹的冗余

4，总结就是普通的web项目其实不太需要将依赖放在dev中，因为我们不会提供给别人去依赖，那么devDependencies其实也不会起作用，打包时也不会将dev中的依赖打包进去，因为是根据引用树来决定

npm3之前的依赖下载方式是，每个依赖本身目录下会有自己的“依赖目录”，这样的坏处是会造成大量的冗余，且如果依赖的链很长那么目录层级会非常的深；npm3之后会将所有的链式依赖全部平铺在最外层的目录，如果有重复的不会重新下载，如果有冲突则会fallback到之前的行为下载其自身的依赖目录。

我在install时遇到的问题：

1，如果项目本身的package-lock.json和yarn.lock没有删除的话，直接执行会卡在ideal tree这个步骤，目前不清楚是为什么，可能是网络问题，可能是缓存问题或是node的版本问题，我在使用nvm切换到低一些的node版本后就可以“顺利install”

2，删除package-lock.json后，install时会判断依赖的版本规则，并最终输出确定的版本，所以这个过程中就会出现“依赖冲突 eresolve”这个问题，但此时的依赖冲突是由peerDpendencies导致，这个下面再说

3，这是npm7引入了更strict的规则所导致的问题，尽管使用--force和--legacy--peer-deps(忽略peer依赖的自动安装，也就不会造成冲突)可以强制install，但这并没有解决实际的问题，因为此时模块在错误的版本环境中工作，可能造成不可预知的错误

4，install结束后会提示有high/critical的警告，尝试使用audit去fix但是没有available fix，因为“peer 冲突无法解决”，举个例子B模块要在1.0的A环境中运行，而C模块要在2.0的A环境中运行，此时就没法确定正确的A依赖版本，虽然项目也能run，但它是vulnerable的；



peerDependencies:

对等依赖，其目的是申明该依赖需要在什么样的环境下运行，也就是一种work with的关系，并不是use。譬如element ui，vite需要vue的宿主环境，它们不需要“使用”vue“，但是需要运行在宿主项目中的”vue“环境中。

npm1,2,7+会直接下载peer依赖；3，4，5，6不会下载，所以需要在外层的dependencies中申明对应的peer。

由于宿主环境是指最外层的依赖目录，那么对应的一个name的依赖只能存在一个版本，此时如果没有合理的设置各个子依赖的peerDependencies就一定会出现冲突，必须保证它们和顶层项目中申明的环境依赖是不冲突的，否则install的过程会出现问题，尽管可以忽视这些问题，但在条件允许的情况下还是不推荐这样做。



npm包版本号规则：

~：~1.1.0:  1.1.0<=版本号<1.2.0;   ~1.1 与上相同;   ~1: 1.0.0<=版本号<2.0.0

^:   匹配左侧第一个非0数字   ^1.1.0:  1.1.0<=版本号<2.0.0   ^0.2.3:     0.2.3<=版本号<0.3

## vue-cli构建项目

### vue add

vue add 是vue-cli提供的命令行接口，可以通过它来方便的安装插件。插件包含一个generator（用于创建文件）和运行时插件（调整webpack核心配置和命令注入），所以当add一个插件时会改变项目的目录结构，添加（默认生成）一些插件的默认配置文件。且插件是对“项目”的一种增强，譬如编译阶段的优化，提供项目测试工具，代码风格的支持等，而不是功能的扩展，它和依赖本质上的区别就在这里，也就是项目在真正运行时原则上是不需要这些插件的！所以当你add后这些插件的依赖选项都会被配置在devDependencies中，并在项目中生成一份插件对应的模板配置文件。其实这里的插件和之前peerDependencies所说的插件有一些相似，都是对某种功能的增强，所以其需要特定的插件环境。

**插件最重要的一点就是需要 插入，类比到element-ui是vue的一个插件，我们必须手动调用vue.use(elmentui)才能在项目中正确的使用element-ui，这个挂载过程就是插件的插入。且插件开发过程中依赖运行环境也是很正常的，比如我们开发一个vue的ui插件，势必要import ref等一系列vue的功能才行，这和插件需要插入宿主环境中并不矛盾**

### webpack

vue-cli的打包实现还是使用的webpack，想要配置webpack模块需要在vue.config.js中自行添加。

当然也可以直接使用webpack，但是这样我们的项目依赖和插件就要自己手动添加，web-pack，web-pack-server等；并且在运行npm run dev等脚本时，需要在package.json中自行编写webpack的script。

## vite

vite是一种“傻瓜式”的构建工具，所以文档看起来非常的“简陋”，因为默认情况下的构建几乎不需要修改任何东西。

需求落地才能产生结果，光看这些文档是无法理解里面的配置到底能解决什么问题，譬如postcss，各种增强式plugin，这些前端项目中为了解决某个问题衍生出的solution并不是vite本身的知识，想要了解到这些东西只有实际开发+时间积累+主动拓宽视野。大致浏览了一些基本配置模板，项目整体结构，现阶段已经够用，等到实际要部署项目或者项目中有某些配置需求时再去查阅官方文档和对应的plugin等。以下为常用的vite模板配置：

https://blog.csdn.net/weixin_45822171/article/details/127275984

https://blog.csdn.net/m0_55357295/article/details/128322526

https://juejin.cn/post/7147353734912147470



### rollupOption

vite“摒弃”了webpack这个较重的打包工具，内部使用rollup这种有较多插件的打包工具，需要什么插件可以自行配置。

打包过程中原生的rollup配置使用rollupOption进行配置。

external:第三方依赖不会被打包进bundle，使用cdn的形式引入（需要下载）



### 常用API

resolve.alias:路径别名。 注意：使用别名的路径不应该再使用相对路径，要使用绝对路径。

在vue-cli中也可以在jsconfig.json中去配置path来达到相同的目的。

```json
import {defineConfig} from 'vite'
import {URL,fileURLToPath} from 'node:url'
import {join} from 'path'

export default defineConfig({
    resolve:{
        alias:{
            '@':fileURLToPath(new URL('./src',import.meta.url))//import.meta.url 是一个 ESM 的原生功能，会暴露当前模块的 URL
        }
    },//方式一
    resolve:{
        alias:{
            '@':join(__dirname,'src')
        }
    }//方式二
})


//jsconfig.json配置方式
{
    'compilerOptions':{
        'baseUrl':'./',  //以当前目录作为项目根目录
        'paths':{
            '@':['src/'],
            '@/*':['src/*'],  //---->@/a.js=./src/a.js
        }
    },
    'include':['src/**/*.js'],//搜索时希望这些文件夹中的这类文件出现在搜索域中
    'exclude':['node_modules']//不希望出现在搜索域中的内容
}
//jsconfig是个增强开发体验的配置文件，比如路径的简写，搜索目标的指定等。vite使用alias和meta.base来实现路径简写
```

## Css方案

### Css in Js

诞生原因：

css文档级别，整体比较臃肿，动态变量支持不友好，选择器多了之后容易产生冲突。

且前端项目打包时css是可以被打包进js文件的，也就是最终的包中只有js+html文件，css内容被“内联”进了js文件。

根据这个特性就出现了直接用js“写”css的方案，因为是js的运行环境所以可以对css做到增强，可以方便的实现换肤等功能

实现：vanilla-extract



### Pre-Processor

not-css to css

将特有的语法如less，sass转换成css。这些语法也是为了弥补css本身的一些缺陷，使得开发更加高效。

https://segmentfault.com/q/1010000002527156

### Post-CSS

post-css本身并不是一个post-processor，它只是一个transpiler，将css’翻译‘成一个AST(abstract syntax tree)抽象语法树，方便作为’插件‘的post-processor对css进行功能上的增强

**postcss-import VS css import**

css 原生的import是阻塞加载的，多个import必须顺序加载而不能异步同时加载，会对页面加载速度造成影响。

原生link方式引入css可以异步同时加载，更加推荐。

postcss的import是一种内联的方式，直接将外部css文件内容插入到本文件中或style标签中。但是这样也将单页文件体积变大，仍然会阻塞加载速度，相比之下不用多次请求css文件是它比原生import优秀的地方，且css文件内容本身体积并不大，所以对加载速度影响还是比较小的。应该还是要注意不要引入过多，过大的css文件。

### Post-Processor

css to supercss 将原生css优化成最符合当前浏览器的css。

https://www.hongkiat.com/blog/css-post-processors-tips-resources/

pre和post的区分其实没有什么意义，本质都是对css的一种优化。更应该关注该领域中常用的主流方案应该怎么配合

### Tailwind

tailwind只是一个css的framework，它仅仅提供了一种css的方便写法。

css有一种Atomic css的方案，即每一个.class{}中都只有一条属性语句，实际使用时在一个元素上会应用多个class

tailwind简化了这个过程，使得我们可以直接在tailwind的className属性上写style语句。

尽管这种方案可以复用+组合原子的class，但是实际开发中每个元素都要重写一遍所有的classname，这样难道不会造成冗余吗？

tailwind官方提供了一些解决方案：https://tailwindcss.com/docs/reusing-styles

其不鼓励“class”的真实复用，而是通过插件同时修改，循环展开，组件复用等方式间接的去解决这个问题

## 静态资源路径处理

问题来源：在使用vue-cli/webpack进行打包时，图片、媒体等静态资源在引入时需要使用require才能在生产环境中获得正确的资源路径

### require历史演化

1，当多个外部JS文件被引入时，很容易产生变量重名的冲突，最初使用命名空间来解决问题

```js
<script src='./a.js'></script>
<script src='./b.js'></script>

//a.js
let app.a={}
app.a.name='a'

//b.js
let app.b={}
app.b.name='b'

```

显而易见，当我们按照a,b的引入顺序时，我们可以在b模块中访问app.a的各种变量，且由于命名空间a,b的存在，不会造成混乱，这似乎很符合我们的要求；然而我们可以在b中修改a中的变量，这显然不是模块a所希望的行为；

2，使用函数闭包与scope来解决模块之间的修改问题，使得模块之间只能get值而不能修改值

```js
//a.js
let app.a=(function()
{
    let name = 'a'
    let age = 24
    return{
        getName:function()
        {
            return name;
        }
    }
    
})()
```

此时我们可以通过app.a.getName来获取name值，却不能改变name值；注意此时app.a的写法，先定义了一个匿名函数，随后直接调用该匿名函数，app.a为该匿名函数的返回值。不过该方案仍然无法解决顺序加载的问题，a模块始终无法访问在它后面加载的模块。且我认为这种方法还有其他的弊端，由于模块定义利用了函数，假设此时我确实想动态更改name值要怎么办，或者说该模块有一个count值想要记录某个函数调用次数，这些实现起来似乎都非常的困难

3，模块的概念被正式引用，每一个文件为一个模块，其中内部的变量均为私有，只有模块自身可以访问。不同的规范有不同的实现方式，CommonJs规定模块内部有require和module这两个变量可以使用，require则就用来加载模块。其中module代表当前模块，包含了模块信息。exports是module的一个属性，代表当前模块要导出的变量或者接口。require获取到的值就是一个模块exports的值。且为了方便，CommonJs直接提供了exports变量，我们可以直接使用exports.name=name而不需要module.exports.name=name。

require会缓存模块，当在一个文件中require两次同一个模块时，第二次require返回的即第一次require后的值，不会再重新加载。

**require是拷贝，而不是返回原exports对象**

```js
//a.js
let name = 'a'
let age =10
exports.name=name
exports.setName=function(sname)
{
    name = sname
}

//other module
let a=require(./a.js)
//该语句类似于
let a={}
a.name=exports.name//a.name并不指向exports.name
a.setName=exports.setName//函数的拷贝似乎没有什么意义，其执行内容都是一样的
//所以setName更改的还是模块a本身的name值，而我们的a变量的name是没有被改变的
//且由于缓存机制，无论require多少次返回的都是同一个a变量
console.log(a.name)//打印为a
a.setName('tob')//此时改变的是模块a的name值
let aa=require(./a.js)//再次require
console.log(a.name)//此时打印仍为a
//个人的一些思考：由于对象和基础类型值的区别,exports的行为也会有区别。例如该例中name和age都为基础类型，那么exports.name在赋值时本身就进行了一次拷贝，如果接下来再改变name值，exports.name也并不会同步更新，不过这似乎没什么影响，因为require的缓存+拷贝机制，一旦我们引入一次之后，接下来require的都是该缓存值，其本身也不会改变。这也能阐释一些模块设计的原则，外界不要改变模块内的变量值，内部改变仅为模块自身可见，只为外部提供方法。
//如果我们想始终获取模块最新值，定义函数或许是一种好方法
exports.getName=function()
{
    return name;
}
//个人觉得这样是可行的，尽管存在拷贝机制，但是函数的执行内容不会发生改变，name始终都是模块a本身的变量地址，但由于是函数返回值我们不可改变它，完美的符号我们的需求。或许我们应该少直接导出值，除非是一些与模块a本身不再有关联的值，因为获取到该值后仅仅相当于一种字面量的初始化，外部拿到之后需要自己做自定义操作。
```

值得注意的是require是一个同步运行的方法，这在后端中没有什么问题，但在前端中由于js等资源都需要网络连接去访问，这会非常影响页面加载速度，所以在后续也推出了异步的require方案，如require.js等；es6也推出了import等类似的机制来实现模块化。script原生标签的加载本身也存在这个问题，其使用async或者defer来进行解决

### MOCK require in Browser

根据上面的介绍，对于浏览器的运行环境是不支持require的，所以webpack等在打包时会将其转化为浏览器可运行的代码，下面是如何模块的方法

```js
(function(modules){
    //缓存已加载模块
    let installedModules={}
    
    let require = function(moduleName)
    {
        //缓存中已经加载，直接返回即可
        if(installedModules[moduleName])
            {
                return installedModules[moduleName].exports
            }
        //未加载就需要加载
        let installedModules[moduleName]={
            modulename:moduleName,
            export:{}
        }
        let module = installedModules[moduleName]
        //这一步最为关键
        //提供了module和require两个变量供模块来使用,module用来存放该模块的信息
        //require函数则用来创建/缓存需要引入的模块
        modules[moduleName].call(module,module.exports,require)
        return module.exports
    }
    require('index.js')
})(
    {
        'a.js':function(module,exports,require){
         	//a.js的内容   
            exports.name='a'
            exports.age=15
        },
        'b.js':function(module,exports,require){
            //b.js的内容
            exports.name='b'
            exports.age=20
            
        },
        'index.js':function(module,exports,require){
            //index
           let a = require('./a.js')
           let b = require('./b.js')
        }
    }
)
//注意这里匿名函数直接调用的写法，别被绕晕了！
```

#### 拷贝机制update

在模拟require的实现方式时，发现对于exports的处理实际上就是传入exports对象，并直接通过exports.attr进行属性赋值。所以拷贝就是一种浅拷贝，即基础类型为值的拷贝，对象类型为引用赋值，所以基础类型的改变不会被影响，而对象类型的改变会影响到exports后的值。Js中，对于一个定义在函数中的变量x，如果该函数返回一个访问该变量的闭包函数，我们在函数外调用闭包函数也依旧能访问到该变量x的原始值，这个特性很重要，我认为是因为function是一种对象类型所导致的，返回闭包函数使得外部持有该函数的引用，而x的地址由于被该闭包函数访问所以不会销毁。

默认的import也是浅拷贝；但是当使用import {name,age} from 'a.js'时，name age无论是基础类型还是对象类型，都始终会和模块内的值始终保持一致。

缓存机制是真实存在的。

一些参考：

https://juejin.cn/post/6844903957752463374

https://zhuanlan.zhihu.com/p/113009496

### require在打包过程中的机制

由于在打包过程中，静态资源（如图片，媒体，字体文件）会进行‘编译’，资源名称和位置会发生改变，如./asset/a.png在打包完成后，真实的图片可能就变成了/img/a.avxc67c.png，所以在编译过程中需要一种机制将src的值也替换为该值。

默认情况下，使用静态路径赋值src='./img.png' 会自动转换为 src=require('./img.png')，webpack在遇到src，url()，@import时会自动开启require的特性 

而:src='path' 动态绑定时，此时的path为一个变量，编译时无法预处理，所以需要显式的加上require(path)

上面介绍过require是一种模块引入的机制，在webpack中，可以配置对应的module规则，比如在图片较小时直接返回base64编码，而图片较大时返回编译后的url。

public目录下的资源会stay original，不会经过编译，而只是简单的复制。所以public目录下的资源在使用时必须使用绝对路径

参考：https://juejin.cn/post/7159921545144434718#heading-0

#### 何为base64

非常简单，即使用64进制（A-Z a-z 0-9）来表示一串二进制流。2的6方为64，所以1个base64的标识符可以表示6位，为了对齐，我们需要8的倍数，那么就使用24位，即4个base64的标识符来表示24bit的数据量

其实就和用16进制一样，我们用两个16进制的数字表示8bit的数据量，只不过是同样的二进制流使用了不同的表述方式。

### Vite的异同

vite使用import的方式

```js
import imgUrl from './asset/a.png'
```

其规则和webpack中require时大同小异，比如自动转换静态资源（图片，媒体，字体等）的url，根据资源大小决定内联base64还是使用外部url等；public目录下的资源也是简单的复制，不过访问方式推荐直接使用 / 根目录访问

对于根目录 / 的思考：当项目部署在生产环境后，我们引用一个资源是下面的形式：

```html
<img src='/icon.png'/>
```

要知道资源是放在服务器上的，所以此时会发起http请求去访问该资源，而此时的root就和nginx中的root配置匹配上了，我们通过/就等于访问了该root下最外层的资源，而不用在加盘符什么的，这些在nginx中已经配置好了

详情参考vite 静态资源处理

关于vite cdn引入库与静态资源cdn切换的思考：

https://ainyi.com/119

https://juejin.cn/post/6844903904719667208 有点难搞

图片vbind的解决方法：https://blog.csdn.net/chunxiaqiudong5/article/details/126072442   

## Nginx部署

1，当vue-router的历史模式在没有使用hash模式时，对于单页面应用，对应路径的html文件实际是不存在的，此时需要使用try_files来进行适配，它其实是一种”失败处理“的策略，在找不到对应文件时统一使用目标文件。注意try_files的格式要正确，空格也会影响配置结果（好像是，因为我多打了一些空格该配置完全就不生效）。而hash模式实际上并没有将url发送到服务器，所以服务器不用做其他配置

2，root配置的最终路径为root+location的拼接，而不是简单的替换，所以想对访问路径设置别名会有一些麻烦；

3，nginx提供了alias来设置路径别名，即location完全替换alias的完整路径。

4，在生产环境中，当访问路径不是根目录/时，打包时对应的配置也需要发生改变。vite的base也要设置为对应的子路径或完整的url目录。但此时有一个nginx的bug，alias在配合try_files无法正常工作，只能切换为root进行配置

### nginx反向代理与负载均衡

何为反向代理

重定向与反向代理的区别

反向代理为什么提高了吞吐量(nginx本身性能较高，且对于请求的处理非常优秀，但是对于单服务器而言这并没有太大意义)

从登录页面重定向带来的思考，由于前后端的分离，路由的拦截是发生在前端

NGINX通过lua脚本或者njs等插件虽然也能实现对于url进行判断在重定向对应的页面的功能，但是这种思路有点反人类

### Session，Cookie，Token

这几个东西到底是怎么定义的

存储在哪里的（本地存储的几种方式,localstorage/session storage等）

在功能模块中扮演了什么角色

