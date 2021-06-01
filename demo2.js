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