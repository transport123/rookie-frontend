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

事件的捕获会从父元素一直到目标元素，这个目标元素实在是令人感到困惑，因为似乎在捕获链开始时这个元素（target)就已经确定了,将target赋值给event



