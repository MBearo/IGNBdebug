# IGNBdebug
~~IG夺冠，写个小程序监控庆祝下~~ 为了更好的监控和还原小程序中的错误，写了这么个玩意。和现有的json-test并不冲突，这个项目还处于初级阶段
## 使用
#### 1.引入资源
把dist目录下的IGNBdebug.min.js复制到小程序的目录中，并在app.js中引用，一定要放到App对象上面，要不然不好使
```
var IGNBdebug = require('IGNBdebug.min.js') // 引用xbossdebug
IGNBdebug.config.key = 'anhao' // key为自定义唯一值，用于后端记录时区分应用
IGNBdebug.config.url = 'https://xxxxx.com/'; // 上报服务端地址
```
#### 2.测试一下好不好用
```
App({
  onLaunch: function () {
    xbossdebug.error('error')
  }
})
```
#### 3.控制台查看network，如果看到一个指向你配置url的请求，那就成功了
```
// 发送的结构如下
{
    key: String // 应用唯一id
    breadcrumbs: Array // 函数执行面包线，方便用于错误重现
    error: String // 错误堆栈信息
    systemInfo: Object // 用户系统信息
    notifierVersion: String // 插件版本
    locationInfo: Object // 用户位置信息
}
```
## 更多配置

如果你的应用日志量较大，可以通过以下参数合并日志和随机抽样。
```
IGNBdebug.config.random = 1 // 默认为1，表示100%上报，如果设置0.5，就会随机上报
IGNBdebug.config.repeat = 5 // 重复上报次数(对于同一个错误超过多少次不上报)
IGNBdebug.config.mergeReport = true, // mergeReport 是否合并上报， false 关闭， true 启动（默认）
IGNBdebug.config.except = [ /^Script error\.?/, /^Javascript error: Script error\.? on line 0/ ], // 忽略某个错误
```
还有些配置没写全，边开发边补充
## 属性
| 字段	 | 类型	 | 含义 |
| ------ | ------ | ------ |
| config | Object | 配置项 |
| handlers | Object | 自定义事件存储 |
| errorQueue | Array | 错误信息队列 |
| repeatList | Array | 重复错误队列 |
## 方法
#### log, debug, info, warn, error
```
IGNBdebug.log("msg" || {}); //手工上报方法，根据log，debug，info，wran，error 对应上报时的 level: 0,1,2,3,4
```
#### on,off,trigger
```
var IGNBdebug = new GER();
IGNBdebug.on('someCustomEventName',(arg1,arg2)=>{
    
});
IGNBdebug.trigger('someCustomEventName',[arg1,arg2]);
```
## 事件
#### beforeReport
上报之前拦截，如果返回值是false，则阻止上报动作。
#### afterReport
上报成功之后触发。

## 开发
```
$ npm install
// 监听开发模式(边写边打包)
$ npm run watch
// 开发模式（打包）
$ npm run dev
// 生产模式（打包并且压缩）
$ npm run build
```
## TODO
拦截wx.request
## 抄袭项目
[知乎小爝的一个js监控项目](https://github.com/gomeplusFED/GER)