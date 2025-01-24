import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import axios from 'axios'
import { defineEventHandler, createError } from 'h3'

const filePath = 'data/i5/new.json'
const fetchUrl
    = 'https://stolo-data-service.prod.stolo.eu-central-1.aws.bmw.cloud/vehiclesearch/search/nl-be/vehiclefinder?maxResults=5&brand=BMW&hash=889c6ce62a4e7c230a55aa25226f173f5ab0115e105a45916fb6b6c4fd0c1f38'
const fetchBody = {
  searchContext: [
    {
      model: {
        marketingModelRange: {
          value: ['i5_G60E', 'i5_G61E'],
        },
      },
    },
  ],
}

async function fetchAllVehicleData() {
  let allData = []
  let startIndex = 0
  let totalCount = 0

  try {
    do {
      console.log(`Fetching data from ${startIndex} to ${startIndex + 4}...`)
      const response = await axios.post(`${fetchUrl}&startIndex=${startIndex}`, fetchBody)
      const { metadata, hits } = response.data

      if (!totalCount) {
        totalCount = metadata.totalCount
      }

      allData = allData.concat(hits)
      startIndex += hits.length
    } while (allData.length < totalCount)

    return allData
  }
  catch (error) {
    console.error('Error fetching vehicle data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch vehicle data',
    })
  }
}

async function updateVehicleData(existingData, newData) {
  const existingDataMap = new Map(existingData.map(item => [item.vehicle.vssId, item]))
  const updatedData = []

  for (const newItem of newData) {
    const { vssId } = newItem.vehicle
    if (existingDataMap.has(vssId)) {
      // Update existing item
      const updatedItem = { ...existingDataMap.get(vssId), ...newItem, status: 'available' }
      updatedData.push(updatedItem)
      existingDataMap.delete(vssId)
    }
    else {
      // New item
      updatedData.push({ ...newItem, status: 'available' })
    }
  }

  // Mark remaining items as sold
  for (const oldItem of existingDataMap.values()) {
    updatedData.push({ ...oldItem, status: 'sold' })
  }

  return updatedData
}

export default defineEventHandler(async () => {
  if (existsSync(filePath)) {
    try {
      const fileData = JSON.parse(await readFile(filePath, 'utf-8'))
      const { data: existingData, retrievedAt } = fileData
      const now = Date.now()

      // Check if the data is older than 1 hour
      if (now - retrievedAt < 3600 * 1000) {
        console.log('Returning cached data.')
        return fileData
      }

      console.log('Data is older than 1 hour. Fetching new data...')
      const newData = await fetchAllVehicleData()
      const updatedData = await updateVehicleData(existingData, newData)

      const updatedFileData = {
        data: updatedData,
        retrievedAt: now,
      }

      await writeFile(filePath, JSON.stringify(updatedFileData, null, 2))
      console.log('Updated data written to file.')
      return updatedFileData
    }
    catch (error) {
      console.error('Error reading or processing existing data:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to process data file',
      })
    }
  }
  else {
    console.log('JSON file does not exist. Fetching data...')
    const newData = await fetchAllVehicleData()

    const fileData = {
      data: newData.map(item => ({ ...item, status: 'available' })),
      retrievedAt: Date.now(),
    }

    await writeFile(filePath, JSON.stringify(fileData, null, 2))
    console.log('New data written to file.')
    return fileData
  }
})
