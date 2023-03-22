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