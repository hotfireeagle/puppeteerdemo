第15期技术部周会，技术分享内容：puppeteer介绍。

如何对puppeteer做定义？先来看下在puppeteer官网中是怎么对其进行介绍的：

> Puppeteer 是一个 Node 库，它提供了一个高级 API 来通过 [DevTools](http://www.puppeteerjs.com/(https://chromedevtools.github.io/devtools-protocol/)) 协议控制 Chromium 或 Chrome。Puppeteer 默认以 [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) 模式运行，但是可以通过修改配置文件运行“有头”模式。

那这体现了以下要点：

+ 一个在node.js中的库；（注：后面也推出了基于.Net平台、python语言的puppeteer绑定）
+ 功能是用来自动控制chrome浏览器的；
+ 实现控制的原理是利用了devtools protocol；
+ 被自动控制的浏览器以headless模式运行。

在这一系列名词的狂轰滥炸下，有两个知识点尤为陌生：devtools protocol；headless模式；接下来将首先对其进行解释介绍。

# 1、Chrome DevTools Protocol

浏览器的blink内核提供了一套API接口把自己的功能给暴露了出去。同时，blink内核规定API的传参数据必须满足chrome devtools protocol规范，控制端和浏览器的数据传输基于websocket协议。

翻译成大白话就是：小A有端茶倒水的能力，小B笨不会，那它就想要让小A给它做这个事。小A自然也不会轻易答应，可又狠不下心不帮忙，于是就制定了一个规则给小B，你叫我做事的时候，加个请字先，然后再说要做什么事，否则的话那么免谈。

![](http://wx3.sinaimg.cn/large/006ARE9vgy1g0ixlgbhs3j305i05iaad.jpg)

小B为了喝水，那自然得遵守这个规定，于是两人“愉快的”联动了起来。

![](https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fwww.lovehhy.net%2Flib%2Fimg%2F11101908%2F1497093_1702254088.jpg&refer=http%3A%2F%2Fwww.lovehhy.net&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1628519423&t=ca630a5f83e161bae10d9ea7ea0cf0b0)

回到正题，需要注意的是，浏览器上经常用来debug的Devtools也是基于Chrome DevTools Protocol协议来实现其众多功能的。

## 1-1、Chrome DevTools Protocol下的消息长什么样？

在启动浏览器时，指定参数--remote-debugging-port可以把Chrome DevTools Protocol协议给暴露出来。

```bash
/Applications/Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=9222
```

然后打开localhost:9222，指定一个想要查看Chrome DevTools Protocol的具体页面（可查看当前浏览器打开的所有tab页面）。试着输入一个baidu.com并查看它，接着再localhost:9222页面中打开调试器，切换到NetWork中的WS一栏中，如下所示：

![image-20210530130742837](https://zuwuzuwebs.oss-cn-beijing.aliyuncs.com/douyinImgs/Snipaste_2021-07-11_17-48-48.png)

可以看到在在这个websocket中发了很多消息。类似于：

```bash
{"id":1,"method":"Network.enable","params":{"maxPostDataSize":65536}}	
{"id":2,"method":"Page.enable"}	
{"id":3,"method":"Page.getResourceTree"}	
```

可以发现chrome devtools protocol下一个消息数据具备以下几个要素：

+ ID唯一标识，同时也能清晰的表达出双方发送的消息数量；
+ method指示了要让浏览器做什么工作；
+ 如果还需要提供入参数据给method的话，那么通过params指定。

接下来利用这个chrome devtools protocol来实现一个简单的控制浏览器效果。先来看下演示效果：

![](https://zuwuzuwebs.oss-cn-beijing.aliyuncs.com/douyinImgs/ezgif.com-gif-maker.gif)

如上所示。

+ 1、左侧是被控制的浏览器；右侧做了一个控制端的前端页面。其关系可以理解为左侧是空调，右侧是空调遥控器；
+ 2、右侧实现的控制功能是：可输入任意域名，点击提交后，左侧浏览器将会自动打开该网页。

需要注意的是，上面是在同一台电脑上演示的控制效果，可能“被控制效果”体现的不明显。但是，使用手机访问控制端的前端页面也一样可以控制电脑的浏览器，这里为了录屏方便，就都在同一个设备上进行了。

抛开这个杀鸡焉用牛刀的demo演示功能来说，上图控制端发给被控制浏览器的消息就是满足了chrome devtools protocol，消息的关键代码如下所示：

```javascript
 const message = {
    id: 1,
    method: "Page.navigate", // 网页跳转动作
    params: {
      url: req.params.url // 所需要打开的网页地址
    }
 }
```

这是一个例子，如果你想要利用chrome devtools protocol实现更多自动控制操作，那么可以参考[chrome-devtools-protocol官网文档](https://chromedevtools.github.io/devtools-protocol/)了解更多内容。

从上面可以大致明白puppeteer的一些基本实现原理，最为关键的一点就是chrome devtools protocol协议。

同时，实现自动控制浏览器的关键步骤总结如下：

+ 从命令行中启动chrome浏览器，并开启允许远程控制；
+ 控制端程序建立起和浏览器的websocket连接；
+ 控制端程序发符合chrome devtools protocol规范的消息给浏览器，浏览器接收到后会执行其对应的动作；
+ 当浏览器执行出了结果后，也会通过websocket这种全双工的通信协议发回给控制程序端。

puppeteer这个库基本上就是实现了上面这些功能，它为此封装了大量使用起来十分方便的API，使得我们无需考虑怎么启动浏览器，怎么建立websocket连接，发送的消息怎么样才符合chrome devtools protocol，节约了很多工作量。

# 2、浏览器的Headless模式？

即在命令行中可以用没有屏幕外设的形式来运行浏览器。正是由于支持headless，使得puppeteer在没有操作界面的服务器中也可以得到许多用武之地。

# 3、puppeteer可以做些什么？

+ 爬虫
+ 生成和网页表现基本一致的PDF
+ 接口和页面UI的自动化测试
+ 等等......

# 4、实现上面用处的一些基本demo介绍

首先需安装好puppeteer依赖。

```bash
# 推荐使用国内镜像，否则下不动
# 下载puppeteer时也会自动下载一个chromium浏览器
cnpm i --save puppeteer
```

然后，打开[puppeteer中文文档](http://www.puppeteerjs.com/)查看API的用法。

## 4-1、爬虫举例

这里以爬取某网站的《镖人》漫画为例。

在写具体代码前，需要先分析一下每章漫画的入口页面的解析规则、以及总共具有多少章、每章漫画中每个页面的URL链接规则，这里就不展开说了。

关键代码截取如下：

```js
/**
 * 分析每章动画的入口地址
 * @param {*} htmlTxt : 入口页面的html
 */
const analyzeChapters = htmlTxt => {
  console.log("[LOG]: 开始获取每章动画的入口地址")
  const $ = cheerio.load(htmlTxt)
  $("div.tab-content.tab-content-selected.zj_list_con > ul.list_con_li > li > a").each((idx, ele) => {
    const url = ele?.attribs?.href
    const title = ele?.attribs?.title || idx
    console.log("[LOG]:", idx, title, url)
    if (url) {
      const obj = { url, title }
      chapterList.unshift(obj)
    }
  })
  console.log(`[LOG]: 获取每章动画的入口地址完成，共有${chapterList.length}章节`)
}

/**
 * 分析每章动画有几页
 * @param {*} htmlTxt ： 每章动画的入口页面html
 */
const downloadChapter = async () => {
  for (let i = 0; i < chapterList.length; i++) {
    const obj = chapterList[i]
    const { title, url } = obj
    const filePath = `镖人/${title}`
    await mkdirHandler(filePath)
    await page.goto(url, { waitUntil: "domcontentloaded" })
    await sleep(500, false)
    const arr = await page.$$("#page_select > option")
    for (let idx = 0; idx < arr.length; idx++) {
      const sel = `#page_select > option:nth-child(${idx+1})`
      const imgUrl = await page.$eval(sel, ele => ele.value)
      await downloadImg(filePath, idx+1, imgUrl)
    }
  }
}

/**
 * 下载并保存单张图片
 * @param {*} chapterPath ： 章节存储位置
 * @param {*} i : 索引当作文件名
 * @param {*} imgUrl : 图片链接
 */
const downloadImg = async (chapterPath, i, imgUrl) => {
  try {
    console.log(`[LOG]: 开始下载${imgUrl}`)
    const res = await axios({
      method: "get",
      url: imgUrl,
      responseType: "stream",
    })
    const picDir = path.join("./", chapterPath, `${i}.jpg`)
    const writer = fs.createWriteStream(picDir)
    res.data.pipe(writer)
    console.log(`[LOG]: 成功下载${imgUrl}`)
    await sleep(1000)
  } catch(_){}
}
```

运行过程如下所示：

![](https://zuwuzuwebs.oss-cn-beijing.aliyuncs.com/douyinImgs/ezgif.com-gif-maker%20%282%29.gif)

一个有趣的事情：此次分享大概是在6月左右准备的，但是最近在整理运行效果GIF时，发现代码已经跑不起来了，下载图片时会报403错误：大概是源站加入了防爬措施。调了大半天，观察浏览器在正常情况下的请求参数，把cookie、referer等请求头动态的加上去，才运行正常。

实际的爬虫场景会比这复杂的多，很可能需要加上动态IP等各种技术才能解决爬取不了的问题。

## 4-2、生成PDF

相比后端生成PDF，利用puppeteer生成pdf的好处是布局更加方便，遇到样式比较复杂的生成pdf需求来说，后端处理起来会麻烦一些，比如说打水印、在pdf上面加入折线图等图表展示工具等等。

接下来看一个简单示例：

```javascript
/**
 * 生成pdf
 */
const puppeteer = require("puppeteer")

const work = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto("https://juejin.cn/post/6968262966604988429", { waitUntil: "networkidle0" })
  await page.pdf({ path: "demo.pdf" })
  await browser.close()
}
work()
```

运行上述代码之后，将会在本地生成一个demo.pdf文件，页面表现基本和网页上的样式一致。

## 4-3、接口和页面UI的自动化测试

常规自动化测试方案都是自动测接口，但是对于前端页面UI的表现上说，从最初的selenium包括这里介绍的pupeteer，其上手难度相比测接口都会高些。

下面利用puppeteer基于云商贷h5写个基本测试demo，旨在完成下面目标：

+ 测试登录功能正常，且登录之后跳首页
+ 测试浩韵h5渠道已关闭，且登录时禁止登录，而且要弹窗提示该渠道已停用

关键代码如下所示：

```js
/**
 * 测试登录接口正常，且前端登录之后跳转首页
 */
const testCanLoginSuccess = async () => {
  log("测试能否正常登录")
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.goto("https://sit-biz.booleandata.cn/own/?channel=03")
  ])
  // 输入手机号
  await page.type(
    "#__layout > div > div.page-content-view > div > div.formContainer > div > div.row.row1 > div > div > div.md-field-item-control > input",
    "15170306850",
    { delay: 200 }
  )
  await page.click("#__layout > div > div.page-content-view > div > div.formContainer > div > div:nth-child(2) > button > div")
  const inputObj = await prompts({
    type: "text",
    name: "code",
    message: "输入验证码"
  })
  const { code } = inputObj
  // 输入验证码
  await page.type(
    "#__layout > div > div.page-content-view > div > div.formContainer > div > div:nth-child(2) > div > div > div > input",
    code,
    { delay: 200 }
  )
  // 点击登录
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click("#__layout > div > div.page-content-view > div > button > div")
  ])
  const homePage = page.url()
  if (homePage.includes("/home")) {
    successLog("登录功能正常")
  } else {
    errLog("登录功能异常")
  }
}
```

运行效果如下所示：

![](https://zuwuzuwebs.oss-cn-beijing.aliyuncs.com/douyinImgs/40s.gif)

如上，除开在终端中输入验证码外，其它所有工作都是自动进行的。

# 附录

+ [puppeteer代码仓库](https://github.com/puppeteer/puppeteer)
+ [puppeteer官方文档](https://pptr.dev/)
+ [puppeteer中文文档](http://www.puppeteerjs.com/)
+ [devtools-protocol代码仓库](https://github.com/ChromeDevTools/devtools-protocol)
+ [chrome-devtools-protocol文档官网](https://chromedevtools.github.io/devtools-protocol/)

