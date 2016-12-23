# antd连击Select(antd级联多选)

> 经过近一个月的奋战，公司的项目也接近尾声了，分享一下当时为了需求而写的一个插件吧。

### 为什么造轮子
首先我们来看一下antd的选择支持多选

[](https://github.com/hanzhangyu/antdCascadedSelect/tree/master/app/img/antdselect.gif)

接着我们来看下antd的级联选择不支持多选（同样支持搜索等功能）

[](https://github.com/hanzhangyu/antdCascadedSelect/tree/master/app/img/antdcascader.gif)

因为公司的需求需要级联多选，而antd的团队似乎觉得这种情况不多，或者是偷个小懒，不给antd的级联选择预留多选接口，比如说：我要选中国下的北京和美国以及南非，在这上个不同层级上的选项，antd只有树选择能够处理，可是树选择也太难看了，无奈之下自己操刀着手开发

[](https://github.com/hanzhangyu/antdCascadedSelect/tree/master/app/img/cascadedselect.gif)

### 使用

> 环境：ES6，React,Antd,以及lodash算法库和classnames
下载dist目录文件引入即可

### 算法

概况：为每个Option分配一个储存信息的KEY[0,999999]，千分位代表全选的子Option，个分位代表未全选的子Option。
这也决定了每个options的子项不能超过999，但是却带来的是高性能

我上传的是未编译的文件，具体算法见文件，有注释，一时半会说不完

### 最后

更新不会停止，有任何问题直接issue，但精力有限，如果你需要类似的功能欢迎直接引用，或者fork（fuck？好直接）过去，当需要共同改进，请联系我配置权限




