/**
 * 功能描述：杀鸡用牛刀，爬取镖人漫画
 */
const puppeteer = require("puppeteer")
const cheerio = require('cheerio')

const entry = "https://www.dmzj.com/info/biaoren.html" // 爬取入口
const sleepTime = 2000 // 每爬一次的休眠时间
const chapterList = [] // 每章的入口地址，每项形如{ title, url }

const sleep = () => {
  console.log(`[LOG]: 开始休眠${sleepTime}毫秒`)
  return new Promise(r => setTimeout(() => {
    r()
    console.log(`[LOG]: 休眠完成`)
  }, sleepTime))
}

/**
 * 分析每章动画的入口地址
 * @param {*} htmlTxt : 入口页面的html
 */
const analyzeChapters = async htmlTxt => {
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
  console.log(`[LOG]: 获取每章动画的入口地址完成, 共有${chapterList.length}章节`)
}

const main = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const res = await page.goto(entry)
  const txt = await res.text()

  await analyzeChapters(txt)
  await sleep()

  await browser.close()
}

main()