import { defineEventHandler } from 'h3'
import { JSDOM } from 'jsdom'

const BASE_URL = 'https://finder.porsche.com/be/nl-BE/search/taycan'

type Car = {
  title: string | null
  price: string | null
  km: string | null
  power: string | null
  dealer: string | null
  link: string | null
  options: string[] | null
}

async function getLinks(): Promise<string[]> {
  try {
    console.log('Fetching new links data...')

    // Fetch the first page to get total number of cars
    const firstPageResponse = await fetch(`${BASE_URL}?model=taycan`)
    if (!firstPageResponse.ok) {
      throw new Error(`Failed to fetch first page: ${firstPageResponse.statusText}`)
    }

    const firstPageHtml = await firstPageResponse.text()
    const firstPageDom = new JSDOM(firstPageHtml)
    const firstPageDocument = firstPageDom.window.document

    // Extract car links from the first page
    const carLinksSet = new Set<string>()
    const carElements = firstPageDocument.querySelectorAll('main div div section article div a')
    carElements.forEach((element) => {
      const href = element.getAttribute('href')
      if (href) {
        carLinksSet.add(href.startsWith('http') ? href : `https://finder.porsche.com${href}`)
      }
    })

    // Find total number of pages
    const totalPages = 11
    console.log(`Total pages found: ${totalPages}`)

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      console.log(`Fetching page ${page}...`)
      const pageUrl = `${BASE_URL}?model=taycan&page=${page}`
      const response = await fetch(pageUrl)

      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.statusText}`)
        continue
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      const pageCarElements = document.querySelectorAll('main div div section article div a')
      pageCarElements.forEach((element) => {
        const href = element.getAttribute('href')
        if (href) {
          carLinksSet.add(href.startsWith('http') ? href : `https://finder.porsche.com${href}`)
        }
      })
    }

    const uniqueLinks = Array.from(carLinksSet)
    console.log(`Total unique links found: ${uniqueLinks.length}`)
    return uniqueLinks
  }
  catch (error: unknown) {
    console.error('Error in getLinks:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

async function getCars(links: string[]): Promise<Car[]> {
  try {
    console.log('Fetching car details...')
    const cars: Car[] = []
    let itemsRemaining = links.length

    for (const link of links) {
      try {
        console.log(`Fetching details for ${link}`)
        const response = await fetch(link)

        if (!response.ok) {
          throw new Error(`Failed to fetch car details: ${response.statusText}`)
        }

        const html = await response.text()
        const dom = new JSDOM(html)
        const document = dom.window.document

        const titleElement = document.querySelector('main header h1')

        // Extract km, power, and price
        const statsElements = document.querySelectorAll('._1j9sent0._1j9sentc._1j9sentg._18iz1pd8')
        const kmElement = statsElements[0] // First element is km
        const powerElement = statsElements[1] // Second element is power
        const priceElement = document.querySelector('._1j9sent0._1j9sent5._121ldsa5')

        console.log('Found km:', kmElement?.textContent?.trim())
        console.log('Found power:', powerElement?.textContent?.trim())
        console.log('Found price:', priceElement?.textContent?.trim())

        // Get all options
        const options: string[] = []
        const optionElements = document.querySelectorAll('._1177mdf0')

        optionElements.forEach((option) => {
          const optionText = option?.textContent?.trim()
          if (optionText) {
            options.push(optionText)
          }
        })

        cars.push({
          title: titleElement?.textContent?.trim() || null,
          price: priceElement?.textContent?.trim() || null,
          km: kmElement?.textContent?.trim() || null,
          power: powerElement?.textContent?.trim() || null,
          dealer: null, // To be implemented
          link,
          options: options.length > 0 ? options : null,
        })

        itemsRemaining--
        console.log(`Items remaining to fetch: ${itemsRemaining}`)
      }
      catch (error) {
        console.error(`Error fetching data for link ${link}:`, error instanceof Error ? error.message : 'Unknown error')
        cars.push({
          title: null,
          price: null,
          km: null,
          power: null,
          dealer: null,
          link,
          options: null,
        })
      }
    }

    return cars
  }
  catch (error: unknown) {
    console.error('Error in getCars:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

export default defineEventHandler(async () => {
  const allLinks = await getLinks()
  const cars = await getCars(allLinks)
  return cars
})
