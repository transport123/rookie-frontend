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