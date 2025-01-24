import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler } from 'h3'
import { JSDOM } from 'jsdom'

const LINKS_FILE_PATH = path.resolve('data/i5/used-links.json')
const CARS_FILE_PATH = path.resolve('data/i5/used.json')
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 1 day in milliseconds

async function readJsonFile(filePath: string) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  }
  catch (error) {
    return null
  }
}

async function writeJsonFile(filePath: string, data: any) {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function getLinks() {
  try {
    const cachedLinks = await readJsonFile(LINKS_FILE_PATH)

    if (cachedLinks && cachedLinks.timestamp && Date.now() - cachedLinks.timestamp < CACHE_EXPIRY_TIME) {
      console.log('Using cached links data...')
      return cachedLinks.links
    }

    console.log('Fetching new links data...')

    const initialResponse = await fetch(
      'https://bmwpremiumselection.be/nl/?aj=1&s=1&v[]=124&v[]=125&co2min=0&co2max=290&monthlymin=0&monthlymax=0&pmin=0&pmax=180000&kmin=0&kmax=132661&imin=2005&imax=2025&chmin=0&chmax=748&kwmin=0&kwmax=550&pw=ch&l=0&radius=0&zipcode=0',
    )

    if (!initialResponse.ok) {
      throw new Error(`Failed to fetch initial response: ${initialResponse.statusText}`)
    }

    const setCookie = initialResponse.headers.get('set-cookie')

    if (!setCookie) {
      throw new Error('No set-cookie header received from the initial request.')
    }

    const totalCars = Number.parseInt(await initialResponse.text())
    console.log('Total Cars:', totalCars)

    const totalPages = Math.ceil(totalCars / 20)

    // Function to fetch and parse car links from a page
    const fetchPageData = async (url: string) => {
      const response = await fetch(url, {
        headers: {
          Cookie: setCookie,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch page data: ${response.statusText}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document
      const carDivs = document.querySelectorAll('div.car-content.car-bps')

      // Extract and return links from each matching div
      return Array.from(carDivs).map((div) => {
        const carBody = div.querySelector('div.car-body')
        const aTag = carBody?.querySelector('a')
        return aTag?.href || null
      }).filter(Boolean) // Filter out null values
    }

    // Fetch data from the first page
    const firstPageLinks = await fetchPageData('https://bmwpremiumselection.be/nl')

    // Generate URLs dynamically based on total pages (excluding the first page)
    const pageUrls = Array.from({ length: totalPages - 1 }, (_, index) =>
      `https://bmwpremiumselection.be/nl/voertuigen_${index + 1}.html`,
    )

    // Fetch data from all subsequent pages
    const allLinks = [...firstPageLinks]
    for (const url of pageUrls) {
      const links = await fetchPageData(url)
      allLinks.push(...links)
    }

    console.log('Total Links:', allLinks.length)

    // Store the links data with a timestamp
    await writeJsonFile(LINKS_FILE_PATH, { timestamp: Date.now(), links: allLinks })

    return allLinks
  }
  catch (error) {
    console.error('Error in getLinks:', error.message)
    return []
  }
}

async function getCars(links: (string | null)[]): Promise<Car[]> {
  try {
    const cachedCars = await readJsonFile(CARS_FILE_PATH)

    if (cachedCars && cachedCars.timestamp && Date.now() - cachedCars.timestamp < CACHE_EXPIRY_TIME) {
      console.log('Using cached car data...')
      return cachedCars.cars
    }

    console.log('Fetching new car data...')

    const fetchCarData = async (url: string | null): Promise<Car> => {
      if (!url) {
        return { title: null, price: null, km: null, dealer: null, options: null }
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch car page: ${response.statusText}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      const titleElement = document.querySelector(
        'body > div.container-fluid > div.row.flex-xl-nowrap > main > div.row.align-items-center.page-title.pt-5.pb-1 > div.col-12.col-md-8 > h1',
      )
      const priceElement = document.querySelector(
        'body > div.container-fluid > div.row.flex-xl-nowrap > main > div.row.align-items-center.page-title.pt-5.pb-1 > div.col-12.col-md-4.text-right > p.h2.mb-0',
      )
      const kmElement = document.querySelector(
        '#tab-characteristics > table > tbody > tr:nth-child(2) > td:nth-child(2)',
      )

      const powerElement = document.querySelector(
        '#tab-characteristics > table > tbody > tr:nth-child(3) > td:nth-child(2)',
      )

      const dealerElement = document.querySelector(
        'body > div.container-fluid > div.row.flex-xl-nowrap > main > div.row.mb-4 > div:nth-child(2) > div > div > h3',
      )
      const optionsElement = document.querySelector('#tab-options')

      const options = optionsElement
        ? Array.from(optionsElement.querySelectorAll('span, br'))
            .map(node => (node.tagName === 'SPAN' ? node.nextSibling?.textContent?.trim() : null))
            .filter(text => text && text.length > 0)
        : null

      return {
        title: titleElement ? titleElement.textContent.trim() : null,
        price: priceElement ? priceElement.textContent.trim() : null,
        km: kmElement ? kmElement.textContent.trim() : null,
        power: powerElement ? powerElement.textContent.trim() : null,
        dealer: dealerElement ? dealerElement.textContent.trim() : null,
        link: url,
        options,
      }
    }

    const carData = []
    let itemsRemaining = links.length

    for (const link of links) {
      try {
        const data = await fetchCarData(link)
        carData.push(data)
      }
      catch (error) {
        console.error(`Error fetching data for link ${link}:`, error.message)
        carData.push({ title: null, price: null, km: null, dealer: null, options: null })
      }

      itemsRemaining--
      console.log(`Items remaining to fetch: ${itemsRemaining}`)
    }

    // Store the car data with a timestamp
    await writeJsonFile(CARS_FILE_PATH, { timestamp: Date.now(), cars: carData })

    return carData
  }
  catch (error) {
    console.error('Error in getCars:', error.message)
    return []
  }
}

type Car = {
  title: string | null
  price: string | null
  km: string | null
  power: string | null
  dealer: string | null
  options: string[] | null
}

export default defineEventHandler(async () => {
  const links = await getLinks()
  const cars = await getCars(links)
  return cars
})
