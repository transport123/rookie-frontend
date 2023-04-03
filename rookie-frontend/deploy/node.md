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
```

## Css方案

### Pre-Processor

css in js



### Post-CSS

postcss-import VS css import

### Post-Processor
