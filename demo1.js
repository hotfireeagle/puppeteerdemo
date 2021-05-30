/**
 * 功能描述：杀鸡用牛刀，爬取镖人漫画
 */
const puppeteer = require("puppeteer")
const cheerio = require('cheerio')

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
const analyzeChapters = async htmlTxt => {
  console.log("[LOG]: 开始获取每章动画的入口地址")
  const $ = cheerio.load(htmlTxt)
  const list = $("div.tab-content.tab-content-selected.zj_list_con > ul.list_con_li > li > a")
  for (let idx = 0; idx < list.length; idx++) {
    const ele = list[idx]
    const url = ele?.attribs?.href
    const title = ele?.attribs?.title || idx
    console.log("[LOG]:", idx, title, url)
    if (url) {
      const obj = { url, title }
      chapterList.unshift(obj)
    }
  }
  console.log(`[LOG]: 获取每章动画的入口地址完成，共有${chapterList.length}章节`)
}

/**
 * 分析每章动画有几页
 * @param {*} htmlTxt ： 每章动画的入口页面html
 */
const analyChapterLength = async () => {
  for (let i = 0; i < chapterList.length; i++) {
    const obj = chapterList[i]
    const { title, url } = obj
    console.log(`[LOG]: 开始分析${title}页数`)
    await page.goto(url, { waitUntil: "domcontentloaded" })
    await sleep(500, false)
    const arr = await page.$$("#page_select > option")
    const len = arr.length
    obj.len = len
    console.log(`[LOG]: 分析完毕，${title}共有${len}页`)
  }
}

const main = async () => {
  const browser = await puppeteer.launch({ headless: false })
  page = await browser.newPage()
  const res = await page.goto(entry)
  const txt = await res.text()

  await analyzeChapters(txt)
  await sleep()
  await analyChapterLength()

  await browser.close()
}

main()