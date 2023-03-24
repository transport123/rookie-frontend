## Vue入口流程

最外层的index.html(vite阶段开始将index放在public之外)是实际的入口;

index中会执行src/main.js;

main.js会创建app,并将创建的app挂载到index中的对应id上;

挂载后显示的内容就是创建的app(可从文件中指定创建)

采用构建流程（使用vite或者vue-cli）挂载会替换根节点，使用引入js的方式不会，直接通过{{}}表达式使用app中的data

## 模板语法

{{msg}}：标签内容里的绑定形式

如果msg的值中包含<>，这种方法会将其还原成纯文本。

如果想通过msg定义html标签，需要使用v-html，并将标签显示声明，通过v-html赋值属性。





### vue ref和element plus节点

1，ref的用法是没问题的，无论是语法糖setup还是export default方式都是ok的。vue2使用$refs的方式，vue3中也能兼容；vue3更推荐使用const elid=ref(null)的方式，不过要注意如果是export的方式得在setup中return这些refs

2，ref（浅薄来说）提供了一种更便捷的访问元素/节点的方式，不用每次都去查询

3，对于懒加载的元素，需要在确定它加载出来之后才可以访问到它。比如在onMounted方法中使用nextTick访问，或者在opened方法触发后再去访问

4，element-plus的节点并不是我理解中的 html元素，这是今天纠结了4个小时左右才明白的。在ref于其绑定完成后返回的是一个Proxy的Object，其真实对象是element根据不同控件自己定义的 “控件对象”，其中保存着一组构成它的真实元素的属性和方法。尽管通过它的ref/$refs属性可以链式的访问到真实的html元素，但还是有点麻烦的。在使用时或许就不应该这样用，应该通过第一层暴露出的api和属性来控制该控件。

5，querySelector和getElementById是可以用的，今天我犯错把#写成了.才没有查到正确的值！更推荐后者，兼容性更好。



## 练习总结

### 第一次demo

1,跨域请求 客户端与服务端的解决方案分别是什么

https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#%E5%8A%9F%E8%83%BD%E6%A6%82%E8%BF%B0

https://segmentfault.com/a/1190000011145364

https://vue3js.cn/interview/vue/cors.html#%E4%BA%8C%E3%80%81%E5%A6%82%E4%BD%95%E8%A7%A3%E5%86%B3

为什么不能跨域呢？这个限制的意义是什么



2，el-dialog会lock-scroll，导致页面左右抖动，禁用之后虽然没有了该行为，但是仍然可以上下滑动，不知道还有没有更好的方案

3，computed 计算属性好像不能像函数一样调用，需要再实验一下

4，js声明一个对象不能只用let arg;需要let arg={},否则后续无法通过arg.attr新增属性并赋值;

5，在vue的函数中访问data或者method必须使用this. 否则访问的域不对，对应的值会是undefined

6，vue2中对象，列表内部数据变更不会同步到视图，要用this.$set方法触发。vue3不再需要这样做，直接更新属性就会响应到视图

7，当使用this.$option.methods.fuction()调用方法时，此时内部的this不再是vue，会出现一些问题，后续看下这个调用链是什么意思，以及vue中的this到底是在什么scope下起作用

8，http请求还有delete和put方法，delete很像get的请求方式（拼接字符串），put很像post的请求方式（放在body中）

9，this.$forceupdate可以强制vue组件刷新，但是不推荐使用

10，promise中reject是通过不断的throw error向下传递的，因为才catch中会去handlereject，就调用到了回调中的onReject；需要再看一遍reject的完整流程 

https://zh.javascript.info/promise-error-handling

https://blog.towavephone.com/async-exception-throw-evolution/

11，什么是js的proxy object

todo：大列表的解决方案1，分页 2，上拉加载更多-->虚拟滚动

https://vue3js.cn/interview/JavaScript/pull_up_loading_pull_down_refresh.html#%E4%BA%8C%E3%80%81%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86

### 滚动条的控制

![](demo1/scroll-border.svg)

从图中可以了解滚动条到底处于什么位置。滚动条始终会和其右边界对齐，且此时content的padding计算位置发生变化，不再是border的右边界，而是滚动条的左边界；所以当通过增加padding来使得container变宽时，滚动条会随着border而不断的右移

但要注意container的宽高此时需要设置为100vw和100vh(多少都行，但是必须固定)。

对于宽度：默认情况会使得border和视窗对齐，此时滚动条可见，我们通过设置padding只会将内容向左侧顶而不会使得border变宽！（个人认为此时的box-sizing是border-size，所以border始终和右边界对齐）当我们手动设置宽度时默认的box-sizing是content-size，就可以通过增加padding使得border右移。

对于高度：此时overflow属性非常重要，且需要和高度进行配合。假设对于一个container我们不设置高度，默认最终高度是所有子元素高度之和，此时就不存在滚动可言，只有当子元素超出container时才有滚动这个概念，此时overflow才能起到作用。要注意html中，子container的“高度”是可以超过父container的，如果父container设置了hidden，由于此时子container高度等于它的子元素高度之和，所以依然无法滚动。

### 滚动事件的坑

1，区分onscroll事件和wheel事件，onscroll只有在元素真正的产生滚动时才会触发，而wheel事件是监听的鼠标滚轮事件

2，onscroll事件在冒泡阶段不会冒泡，捕获到之后只有触发的元素本身能感知到该事件；尽管document.defaultview触发scroll时scroll会冒泡穿透，但因为defaultview本身已经是最外层元素，所以没什么意义

3，当html和body的高度超过viewport的高度时，自动使用系统的滚动，该滚动事件会冒泡。但是我不认为 最外层会滚动和穿透 有关

#### 事件的产生和传递

事件的捕获会从父元素一直到目标元素，这个目标元素实在是令人感到困惑，因为似乎在捕获链开始时这个元素（target)就已经确定了,将target赋值给event后开始向下传递，直到到达target元素后开始冒泡。所以scroll事件的来源才是滚动穿透这个行为最让人困惑的点。

首先只有能滚动的元素才能产生scroll事件，但这不代表子元素不可以scroll就不能在container中产生scroll事件。因为scroll事件是属于UI事件的，而不属于鼠标事件！也就是它是“二次”产生的！我猜测它的产生是根据一系列的wheel事件以及当前dom树中父子元素是否可以滚动的状态来决定的。当wheel事件向上冒泡时，假如当前元素可滚动，就发出一个该元素的scroll事件，如果wheel事件向上传递到父元素且计算父元素也可以滚动，由于子元素已经发出了scroll事件，此时相当于被“锁定”了，所以父元素不会再发出scroll事件。这属于个人的理解，在元素定位正常的情况下是make sense的。

但是当我们设置了子元素fixed后就会出现不一样的地方。尽管此时wheel事件还是会从子元素传递上去，但是父元素不会再根据wheel事件计算自身是否能scroll，也就是此时正常文档流中的父元素都不会产生scroll事件；只有一种特例那就是window/document.defaultview如果是可以滚动的情况，它就会发出最开始说的最顶层的可穿透的scroll事件，被自己消费。

由于实在找不到scroll事件产生的具体机制，我只能按照这种思路去理解和记忆。黔驴技穷（也令我惊讶为何google也查不到类似的问题）

这是chromium的官方事件模型文档，留个坑吧，也不知道什么时候能涉及到这些知识，似乎将浏览器原理的人非常少，也没有找到太多的技术资源。https://chromium.googlesource.com/chromium/src/+/HEAD/docs/ui/input_event/index.md

currentTarget（只读对象）：只有在事件调用时可以访问到，在console中直接打印event看到该属性是null。该值始终表示实际绑定该事件的元素

Target：表示触发事件的元素

### 跨域方案

原因：为了安全，浏览器限制脚本内的跨 源(origin) http请求。即只能从 加载该资源（脚本）本身的源去请求资源。举个例子：客户端A（浏览器）访问https://domain.com加载了对应的html+css+js，当js文件下载完成后，js脚本通过xhr或者fetch向https://domainx.com发起请求加载图片，由于前后的域发生了变化，该请求就被视为跨域请求，默认情况下就会失败。

源由 地址+端口+协议来唯一标识，任何一个不同都会视为不同源。

方案一：

#### 跨域资源共享（CORS）

通过在HTTP头中加入一组新的标头字段，**通过服务器申明哪些源有权限访问哪些资源**。但是对于 非简单请求 还需要进行一次通过OPTION发起的 预检请求（preflight request)来判断服务器是否允许此次CORS，这几个概念是CORS中的核心机制。

**简单请求**:

1，简单请求不会触发cors预检机制，即该请求就是原请求且response中包含了需要的资源；

2，满足以下所有条件才是一个简单请求：

​	Ⅰ. 使用 get/post/head 方法之一；

​	Ⅱ. 只有一部分标头可以人为的设置 Accept/Accept-Language/Content-Language/Content-Type/Range，其中Content-Type还有更	多的限制。tips：有一部分标头是用户代理自动设置(如Connection，user-agent + forbidden request headers：

​	 https://developer.mozilla.org/zh-CN/docs/Glossary/Forbidden_header_name 即编程人员无法通过代码修改，其实就是 用户代理-	浏览器 帮我们做了	这件事，持有对这些标头的完全控制，保证了安全)

​	Ⅲ. Content-Type指定的媒体类型只能是三者之一 text/plain	multipart/form-data	application/x-www-form-urlencoded

​	Ⅳ. 如果是XHR发出的请求，XHR不能注册upload事件

​	Ⅴ. 请求中不可以有ReadableStream对象

3，此时request 中包含 origin标识请求源，response中包含 Access-Control-Allow-Origin 标识允许的请求源；通过这两个标头即可完成一次简单的跨域请求



**预检请求**:

当一个请求不满足简单请求时，会先发起一次预检请求。该请求通过 OPTIONS方法发起，标头包括 Access-Control-Request-Method标识原request的 请求方式，Access-Control-Request-Headers表示原request中的‘待检查’标头；response中通过Access-Control-Allow-Origin/Methods/Headers来和该请求对应，标识是否允许访问。

当该预检请求成功返回且所有的检查都通过后，才会发起真正的原请求。

tips: 一些浏览器不支持通过OPTION发起的预检请求的重定向，有一些方案

1，将请求改为简单请求，避免预检请求；

2，去掉服务端的重定向

-------->方案退化

1，通过简单请求获取重定向的真实地址

2，使用真实地址再去重新发起请求



**身份凭证**

默认情况下，跨域请求xhr/fetch不会发送身份凭证信息（cookies等）

如果需要的话要在request中将withCredentials设置为true，实际的请求此时会带上cookie；

对应的服务器返回的Access-Control-Allow-Credentials也必须设置为true，否则响应内容会被客户端忽略；

且Access-Control-Allow-Origin/Headers/Methods不可以使用 *，必须明确指明允许的源/头/方法；

预检请求本身不能包含身份凭据，但是它的response需要Access-Control-Allow-Credentials来指明本次跨域请求可以携带身份凭据



文档：https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#%E5%8A%9F%E8%83%BD%E6%A6%82%E8%BF%B0

#### 使用代理Proxy

该方案原理非常简单，以Vue举例，开发环境下在Vue前端服务器上开启一个代理服务器，axios中使用‘/api’标识需要代理的请求，此时在发起请求时会通过代理服务器请求资源，“代理服务器”更像一个中间件，虽然此时它的端口和vue服务器端口不同，但是它本身允许跨域访问，且在response中进行了一些伪装使得客户端无法检测，也就完成了整体的跨域。

```js
amodule.exports = {
    devServer: {
        host: '127.0.0.1',
        port: 8084,
        open: true,// vue项目启动时自动打开浏览器
        proxy: {
            '/api': { // '/api'是代理标识，用于告诉node，url前面是/api的就是使用代理的
                target: "http://xxx.xxx.xx.xx:8080", //目标地址，一般是指后台服务器地址
                changeOrigin: true, //是否跨域
                pathRewrite: { // pathRewrite 的作用是把实际Request Url中的'/api'用""代替
                    '^/api': "" 
                }
            }
        }
    }
}

```

需要注意该方案只在开发环境下起作用，因为生产环境下客户端是从nginx上等静态服务器请求页面资源，除非项目中加入了‘代理中间件’，否则客户端本地不存在代理这个东西，自然就无法使用。

通过配置nginx的代理也可以实现：

```
server {
    listen    80;
    # server_name www.josephxia.com;
    location / {
        root  /var/www/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass  http://127.0.0.1:3000;
        proxy_redirect   off;
        proxy_set_header  Host       $host;
        proxy_set_header  X-Real-IP     $remote_addr;
        proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
    }
}
```

相当于始终向该nginx请求。
