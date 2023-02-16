非bootloader加载的类不包含gc root，这里的包含用的是contain，有些难以理解。
自定义的classloader一旦没有了强引用，都可以被回收。这里对问题的理解应该从Class和Classloader入手 即我们可以通过去除
自定义Classloader引用的方式达到unload 一部分class的目的。class的实例持有Class对象的引用，Class对象持有它的Classloader的引用，
所以当还有class的实例时，这些都是强可达的，不会发生gc。（同时我认为classloader也有它加载的class的引用，否则没有实例时Class就会被unload了)
unload的正确流程是，将class的所有实例全部回收，之后去除Classloader的强引用，就可以使得Classloader与它的Class对象成为不可达，成功回收后就达到了热卸载的目的。
事实上system级别的loader 可能 也是相同的机制，不过因为开发者无法更改其引用或者JVM对其有特殊的标记（比如默认为root）使得它在结果上是不可卸载的




主要对reachabilityFence非常的疑惑，为什么try{dosth}finally{Reference.reachabilityFence(this)}就保证了对象的强可达
有一个链接可以参考 https://mail.openjdk.org/pipermail/jdk-dev/2018-October/002079.html
自己总结一下：
1，java的gc只对 对象可达 敏感，并不关注对象的方法。所以假如一个对象的方法正在执行但是这个对象并不是强可达，
它依然是eligible for collect的。例如new object().foo() 这种调用方式（在异步中似乎很常用）
函数返回的调用方式似乎也是一样的(这里对java栈理解不够。例如A=getA(),getA返回时赋值并出栈，只有A这一个引用。所以如果我们使用getA().func()的方式应该也没有强引用了） 

按照这个说法引申出3条原则
	11，通过调用Reference.reachabilityFence时传入this（事实上调用任何方法都行）足以保证在触发此方法前，reference是保活的。
	12，new A()在触发后---到---可达性检查意识到finally中传入了this  这之间 是否 有race condition，也就是线程安全问题。
	官方回答是不存在，一种情况下new object.foo()会被内联到调用者的方法体内形成一个整体的unit；但是JIT确实可能将 加载进栈调用方法后 但之后
	没有更多使用的变量标记为dead。
	13，即便在12的基础上，从可达性分析上来看，argument 实参 parameter 形参 将实参赋给形参的这个过程是原子性的 -- 不会在此过程中 丢失引用？改变引用的可达性
	这里是回答 函数的触发和函数的执行（也就是入栈过程） 这个过程间是否存在gap导致引用可达性的前后不一致。

2，reachabilityFence这个方法实际就是一个空方法，它的目的其实就是对this做一个引用。因为我们会将此方法写在finally中保证它一定会执行，所以在reachabilityFence(this)
之前该对象都是强可达的。且这个方法打上了ForceInline的注解，使得它会强制内联进调用者的方法体。至于为什么强制内联或许是可以最小的减少调用耗费时间，因为可以去除
入栈出栈这些操作。




