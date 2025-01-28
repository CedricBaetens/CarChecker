<template>
  <div class="p-5 h-[calc(100vh-40px)] flex">
    <!-- Filter Section (Left Sidebar) -->
    <div class="w-1/4 pr-5 h-full overflow-y-auto border-r">
      <div class="mb-5">
        <!-- Price Filter -->
        <div class="mb-5">
          <label class="block mb-1">Max Price:</label>
          <input
            v-model.number="maxPrice"
            type="number"
            placeholder="Enter max price"
            class="w-full p-2 border rounded">
        </div>

        <!-- Sort Options -->
        <div class="mb-5">
          <label class="block mb-1">Sort By:</label>
          <select v-model="sortOption" class="w-full p-2 border rounded">
            <option value="listPrice">
              Price
            </option>
            <option value="prioOptions">
              Most Priority Options
            </option>
          </select>
        </div>

        <h3 class="font-bold">
          Priority Options
        </h3>
        <div v-for="option in priorityOptions" :key="option.id" class="flex items-center">
          <label>
            <input
              v-model="selectedOptions"
              type="checkbox"
              :value="option.name"
              class="mr-2">
            {{ option.name }}
          </label>
        </div>

        <h3 class="font-bold mt-5">
          Other Options
        </h3>
        <div v-for="option in nonPriorityOptions" :key="option.id" class="flex items-center">
          <label>
            <input
              v-model="selectedOptions"
              type="checkbox"
              :value="option.name"
              class="mr-2">
            {{ option.name }}
          </label>
        </div>
      </div>
    </div>

    <!-- Cars Grid Section (Right Content) -->
    <div class="w-3/4 h-full overflow-y-auto pl-5">
      <div class="mb-5 font-bold">
        Total Matches: {{ filteredCars.length }}
      </div>
      <div class="grid grid-cols-4 gap-5">
        <div v-for="car in filteredCars" :key="car.id" class="p-5 border">
          <div>{{ car.status }}</div>
          <a
            class="font-bold"
            target="_blank"
            :href="`https://www.bmw.be/nl-be/sl/vehiclefinder#/details/${car.id}`">
            {{ car.name }}
          </a>
          <img :src="car.image" alt="Car image">
          <div class="flex gap-2 items-center">
            <div class="font-bold">
              {{ formatCurrency(car.listPrice) }}
            </div>
            <div class="text-sm">
              {{ formatCurrency(car.catalogPrice) }}
            </div>
          </div>
          <div class="text-gray-600">
            {{ car.dealer }}
          </div>
          <div>
            <p><strong>Priority Options:</strong> ({{ car.options.filter(o => prioOptions.includes(o.name)).length }}/{{ prioOptions.length }})</p>

            <p class="font-semibold mt-2">
              Included Options:
            </p>
            <ul class="list-disc pl-5">
              <li
                v-for="option in car.options.filter(o => prioOptions.includes(o.name))"
                :key="option.id"
                class="flex items-center">
                <span class="text-green-500 mr-2">✔️</span> {{ option.name }}
              </li>
            </ul>

            <p class="font-semibold mt-2">
              Missing Options:
            </p>
            <ul class="list-disc pl-5">
              <li
                v-for="option in prioOptions.filter(o => !car.options.some(carOption => carOption.name === o))"
                :key="option">
                <span class="text-red-500 mr-2">❌</span> {{ option }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import _ from 'lodash'

const { data } = useFetch('/api/i5/new')

const prioOptions = [
  'Driving Assistant Pack Plus',
  'Driving Assistant Pack Professional',
  'Adaptieve ophanging Professional',
  'Parking Assistant Pack Plus',
  'Parking Assistant Pack Professional',
  'Verwarmd stuurwiel',
  'Verwarmde zetels vooraan',
  'Verwarmde zetels vooraan en achteraan',
  'Panoramisch doorschijnend dak',
  'BMW Iconic Glow Exterieur Pack',
  'Comforttoegang',
  'Sfeerverlichting',
  'M veiligheidsgordels',
  'M sportstuur',
  'Snelladen wisselstroom, meerfasig',
  'Actieve zetelventilatie vooraan',
  'Aanhangwagenkoppeling (elektrisch wegklapbaar)',
  'Elektrische regeling voorzetels met geheugenfunctie voor bestuurderszetel',
  'M Hemelbekleding Anthrazit',
  'Opbergvak voor Wireless Charging',
  'BMW Live Cockpit Navigation Professional met Head-Up Display',
  'M sportophanging',
  'Adaptieve M sportophanging Professional',
]

const selectedOptions = ref<string[]>([
  'BMW Iconic Glow Exterieur Pack',
  'Verwarmd stuurwiel',
  'Adaptieve ophanging Professional',
  'Parking Assistant Pack Professional',
  'Driving Assistant Pack Professional',
  'Sfeerverlichting',
  'M veiligheidsgordels',
  'M sportstuur',
  'Panoramisch doorschijnend dak',
])
const sortOption = ref<'listPrice' | 'prioOptions'>('listPrice')
const maxPrice = ref<number | null>(null)

const formatted = computed(() => {
  const result = data.value.data.map((x: any) => {
    const listPrice = x.vehicle.offering.offerPrices || {}
    const dynamicKey = Object.keys(listPrice)[0]
    const offerGrossPrice = dynamicKey ? listPrice[dynamicKey]?.offerGrossPrice : null

    const equipments = x.vehicle.vehicleSpecification.modelAndOption.equipments || {}
    const options = Object.keys(equipments).map((key) => {
      const equipment = equipments[key]
      return {
        id: key,
        name: equipment.name?.nl_BE || null,
        category: equipment.marketingText?.category?.nl_BE || null,
        salesText: equipment.marketingText?.salesText?.nl_BE || null,
      }
    })

    return {
      id: x.vehicle.vssId,
      name: x.vehicle.vehicleSpecification.modelAndOption.model.modelDescription['nl_BE'],
      status: x.status,
      catalogPrice: x.vehicle.price.grossListPrice,
      image: x.vehicle.media.cosyImages['exterior360ViewImage-50'],
      dealer: x.vehicle.ordering.distributionData.shippingDealerName,
      listPrice: offerGrossPrice ?? x.vehicle.price.grossListPrice,
      color: x.vehicle.vehicleSpecification.modelAndOption.color?.hexColorCode,
      options: _.sortBy(options, 'name'),
    }
  })

  if (sortOption.value === 'listPrice') {
    return _.sortBy(result, 'listPrice')
  }
  else {
    return result.sort((a, b) => {
      const prioCountA = a.options.filter(o => prioOptions.includes(o.name)).length
      const prioCountB = b.options.filter(o => prioOptions.includes(o.name)).length
      return prioCountB - prioCountA
    })
  }
})

const priorityOptions = computed(() => {
  return _.sortBy(
    uniqueOptions.value.filter(option => prioOptions.includes(option.name)),
    'name',
  )
})

const nonPriorityOptions = computed(() => {
  return uniqueOptions.value.filter(option => !prioOptions.includes(option.name))
})

const uniqueOptions = computed(() => {
  const allOptions = formatted.value?.flatMap(car => car.options) || []
  return _.uniqBy(allOptions, 'name')
})

const filteredCars = computed(() => {
  return formatted.value?.filter((car) => {
    const matchesOptions = selectedOptions.value.every(x => car.options.some(option => option.name === x))
    const matchesPrice = !maxPrice.value || car.listPrice <= maxPrice.value
    return matchesOptions && matchesPrice
  })
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>
