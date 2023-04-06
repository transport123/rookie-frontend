## 首次尝试vue router

### vue-router导出问题

vue-router本身没有export default，所以如果想完整的导出，需要使用import * as VueRouter from 'vue-router'

v4.x版本不再使用这种方式，直接导入其中的方法即可。import {createRouter,createWebHashHistory} from  'vue-router'

在创建路由时必须带上history选项，提供一种“回退机制”。且要注意创建路由并不是创建页面，只是创建了一张“页面路由表”，使得router-link可以根据to中的path将router-view的内容设置为对应的页面内容。

### router-link的自定义扩展

(假设包裹router-link的组件名称为app-link)

1，需要在app-link中定义router-link所拥有的所有props，并且在router-link标签上使用v-bind="$props"，这样才能从外部传递props给内部的router-link，其中定义props的方法如下

```vue
<script setup>
    import {RouterLink} from 'vue-router'
    define({...RouterLink.props,inactiveClass:String})
    //这里使用了 ... 展开符将props这个对象的属性全部展开.需要注意define有两种方式，数组或对象的形式都可以，这里使用对象的形式，因为props是一个对象，无法在数组中迭代展开
    //如果想访问自身的props，由于组合式api中没有this指针，只能将define的返回结果用一个常量保存，使用该常量访问自身的props
</script>


<script>
	export default{
     	props:{
            ...RouterLink.props,
            inactiveClass:String
        }   
    }
</script>
```

2，slot在使用时，不仅可以传递纯文本内容，也可以传递完整的标签体。且可以在定义slot时定义变量，并用v-slot在外部来自定义slot的显式内容

```vue

<script setup>
//定义一个简单的mycomponent
    const content = ref('somestuff')
    const countNumber = ref('15')
    
</script>

<template>
	<div>
    	<slot :text="content" :count="countNumber"></slot>
    </div>
</template>

<script setup>
//外部使用插槽
    
</script>

<template>
	<mycomponent v-slot="slotProps">
    {{slotProps.text}} {{slotProps.count}}
    </mycomponent>
	<!--也可以使用解构的方式，但要注意属性名必须相同-->
	<mycomponent v-slot="{text,count}">
    {{text}} {{count}}
    </mycomponent>
</template>
```

3，诡异的属性穿透。非props的属性为attrs，当给模板标签本身设置某个属性但又没有定义prop时，就等于申明了一个attr。该attr在默认情况下会穿透传递给模板内的根节点，假设模板内有多个根节点，则需要使用v-bind="$attrs"来指定某个节点来接收模板的属性，否则会抛出一个warning，警告没有自动接收模板属性的节点。

在route-link的例子中，由于我们给route-link自定义了一个inactiveClass的prop，并且通过v-bind传递给了router-link，但是router-link是没有该prop的，所以对于router-link此时就多了一个inactiveClass的attr；此时attr需要向内部穿透，但是默认情况下不知道穿透给哪个节点，所以就抛出了warning，当手动设置v-bind="$attrs"后警告消除。

令我比较疑惑的点有两个，一方面router-link内部此时就只有一个节点，为何会抛出这种警告呢，难道仅仅是因为有了多余的自定义属性吗，但是默认情况下inactiveClass也并没有传递给内部的a标签；另一方面即便我们使用了v-bind=“$attrs”，此时的$attrs也并不是router-link的额外属性，而是我们自定义的route-link的额外属性！那么对于route-link而言inactiveClass也并不是额外属性，而是一个正常的props，它的$attrs为空，此时的bind也完全没有意义。不太能理解为什么这种情况下还会抛出警告，可能与vue的具体绑定机制有关，当出现额外属性时，我们需要明确接收行为，而不能使用默认行为。

### 外部链接问题

router-link会经过路由控制，所以默认无法跳转外部链接，会带上本地的origin前缀。

可以使用原生的 a 标签来跳转外部链接，但要注意将href拼写完整，必须带上http://完整前缀，否则仍然无法正常跳转

## Navigate方法

开发环境中，a标签也可以使用vue-router的路由表，行为一切正常。

生产环境中，必须通过slot将click事件设置为router-link的内部navigate方法，将跳转事件托管，否则会出现404等错误。

## 两种history模式

### 区分客户端路由与服务器路由

首先，nginx在配置root，alias，location时是在配置服务器路由，即浏览器通过该url会返回哪个资源，通常来说就是我们的index.html，所以当我们不想使用根目录/访问时就必须配置正确的location如/foo；此时index文件成功返回，但是在加载时还需要其他的静态资源css+js，于是会使用http协议去请求这些资源，其url为origin+base+文件名，该值是在vite打包时就已经确定的，那么此时就出现了问题，默认的base为空，而此时在服务器上这些资源是配置在/foo/文件夹下的，那么就会报404的错误。最正确的做法就是将vite的base配置为/foo/即可，不过也可以为nginx多加一个根目录/的路径，让原请求通过根目录路径也能访问到这些资源。

当服务器路由配置正确，此时我们成功加载完index与其需要的资源文件，剩下的任务则交给vue-router完成。vue-router是客户端路由，其工作机制是使routerview显式对应路径的组件。对于使用了vue-router的单页面应用而言，在点击router-link时浏览器不会真的向服务器重新发起请求，而是在客户端进行内部跳转（如果是懒加载的组件，由于静态url由vite的base配置好，只需要访问对应的静态资源后再初始化组件即可），并将浏览器中的url通过window的pushstate方法替换为vue-router中的path。

### WebHistory

当在浏览器中输入url访问时（刷新，后退也是一样的），第一步是根据服务器路由寻找要返回的文件，当访问一个非根目录路径的组件时，由于服务器上没有对应的资源，默认情况下会报404的错误。所以需要通过try_files配置，指明在当前的location访问中，所有找不到的资源都指向index.html，这样就能成功的返回该文件。且此时routerview显式的组件为浏览器中的path；且如果我们设置了webHistory的base值，其会在所有prefix不为该值的路由路径前面拼接上该base值。

### WebHashHistory

Hash#其实就是一种对url的截断，在使用浏览器输入url访问时会丢掉#开始的部分，即在服务器路由寻找资源时只关心其prefix。所以只要我们正确配置了nginx的location，就可以正常的访问多层级的组件，而无需配置try_files。WebHashHistory的base值在<head>中存在base标签时会被忽略，虽然我没有设置该标签，但是仍然不起作用，~~~我猜测是vite默认根据base值创建该标签，所以生产环境中其总是和vite的base值相同。~~我在尝试不配置vite的情况下设置该值，仍然没有任何作用。。

根据测试在浏览器中使用hash#时，完整的url就是 服务器路由path+客户端路由path(客户端的base值不起作用)，实在无法复现其doc里所说的other-folder的情况，只有带#时才会使path变成/#/base；或许这样也是一种合理吧，因为我们需要保证服务器路由的path和#之前的path一致，所以随便设置的情况下它就失效了。

