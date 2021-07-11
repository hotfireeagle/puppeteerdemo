/**
 * 功能描述：杀鸡用牛刀，爬取镖人漫画
 */
const puppeteer = require("puppeteer")
const cheerio = require("cheerio")
const path = require("path")
const fs = require("fs")
const axios = require("axios")
const fsPromises = fs.promises

let page
const entry = "https://www.dmzj.com/info/biaoren.html" // 爬取入口
const sleepTime = 2000 // 每爬一次的休眠时间
const chapterList = [] // 每章的入口地址，每项形如{ title, url, len }

const sleep = (s = sleepTime, log=true) => {
  log && console.log(`[LOG]: 开始休眠${s}毫秒`)
  return new Promise(r => setTimeout(() => {
    r()
    log && console.log(`[LOG]: 休眠完成`)
  }, s))
}

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
    console.log("[LOG]:", idx, title)
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
      const cookie = await page.evaluate(() => document.cookie)
      await downloadImg(filePath, idx+1, imgUrl, cookie)
    }
  }
}

/**
 * 创建文件夹
 * @param {*} title 
 * @returns 
 */
const mkdirHandler = async title => {
  console.log(`[LOG]: 开始新建${title}文件夹`)
  const baseSave = path.join("./", title)
  let isDirExists = false
  try {
    const fsStatus = await fsPromises.stat(baseSave)
    if (fsStatus.isDirectory()) {
      isDirExists = true
    }
  } catch(_) {}
  if (isDirExists) {
    console.log(`[LOG]: ${title}文件夹已存在`)
    return
  }
  await fsPromises.mkdir(baseSave)
  console.log(`[LOG]: ${title}文件夹创建成功`)
}

/**
 * 下载并保存单张图片
 * @param {*} chapterPath ： 章节存储位置
 * @param {*} i : 索引当作文件名
 * @param {*} imgUrl : 图片链接
 */
const downloadImg = async (chapterPath, i, imgUrl, cookie) => {
  try {
    console.log(`[LOG]: 开始下载${i}`)
    const res = await axios({
      method: "get",
      url: imgUrl,
      responseType: "stream",
      headers: {
        Cookie: cookie,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
        "sec-ch-ua": ` Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91`,
        "sec-ch-ua-mobile": "?0",
        "Referer": "https://www.dmzj.com/",
      },
      withCredentials: true
    })
    const picDir = path.join("./", chapterPath, `${i}.jpg`)
    const writer = fs.createWriteStream(picDir)
    res.data.pipe(writer)
    console.log(`[LOG]: 成功下载${i}`)
    await sleep(500)
  } catch(err) {
    console.error(err)
  }
}

const main = async () => {
  const browser = await puppeteer.launch({ headless: true })
  page = await browser.newPage()
  const res = await page.goto(entry)
  const txt = await res.text()

  await analyzeChapters(txt)
  await mkdirHandler("镖人")
  await downloadChapter()
  await browser.close()
}

main()