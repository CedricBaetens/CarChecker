<template>
  <div class="p-5 h-[calc(100vh-40px)] flex">
    <!-- Filter Section (Left Sidebar) -->
    <div class="w-1/4 pr-5 h-full overflow-y-auto border-r">
      <div class="mb-5">
        <h3 class="font-bold">
          Filter by Options
        </h3>
        <div v-for="option in uniqueOptions" :key="option.id" class="flex items-center">
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
          <ul class="list-disc pl-5">
            <li v-for="option in optionsToShow(car.options)" :key="option.id">
              {{ option.name }}
            </li>
          </ul>
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
  // 'Driving Assistant Pack',
  'Driving Assistant Pack Plus',
  'Driving Assistant Pack Professional',
  // 'Parking Assistant Pack',
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
]

// State for selected options
const selectedOptions = ref<string[]>([
  // 'Driving Assistant Pack Plus',
  // 'Driving Assistant Pack Professional',
  // 'Parking Assistant Pack Plus',
  // 'Parking Assistant Pack Professional',
  // 'Verwarmd stuurwiel',
  // 'Verwarmde zetels vooraan',
  // 'Verwarmde zetels vooraan en achteraan',
  // 'Panoramisch doorschijnend dak',
  // 'BMW Iconic Glow Exterieur Pack',
  // 'Comforttoegang',
  // 'Sfeerverlichting',
  // 'M veiligheidsgordels',
  // 'M sportstuur',
])

// Processed cars list
const formatted = computed(() => {
  const result = data.value.data.map((x: any) => {
    const listPrice = x.vehicle.offering.offerPrices || {}
    const dynamicKey = Object.keys(listPrice)[0] // Get the dynamic key
    const offerGrossPrice = dynamicKey ? listPrice[dynamicKey]?.offerGrossPrice : null

    // Extract and format equipments
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
      options: _.sortBy(options, 'name'), // Use the formatted options
    }
  })

  return _.sortBy(result, 'listPrice')
})

const uniqueOptions = computed(() => {
  const allOptions = formatted.value?.flatMap(car => car.options) || []
  const unique = _.uniqBy(allOptions, 'name') // Get unique options by name

  // Separate priority options and the rest
  const prio = unique.filter((option: any) => prioOptions.includes(option.name))
  const rest = unique.filter((option: any) => !prioOptions.includes(option.name))

  // Sort both groups alphabetically by name
  const sortedPrio = _.sortBy(prio, 'name')
  const sortedRest = _.sortBy(rest, 'name')

  // Concatenate sorted priority options with the rest
  return sortedPrio.concat(sortedRest)
})

// Filter cars based on selected options
const filteredCars = computed(() => {
  const result = formatted.value?.filter(car =>
    selectedOptions.value.every((x) => {
      // Handle the special case for 'Driving Assistant Pack Plus' and 'Driving Assistant Pack Professional'
      if (x === 'Driving Assistant Pack Plus' || x === 'Driving Assistant Pack Professional') {
        return car.options.some(option =>
          option.name === 'Driving Assistant Pack Plus' || option.name === 'Driving Assistant Pack Professional',
        )
      }

      else if (x === 'Parking Assistant Pack Plus' || x === 'Parking Assistant Pack Professional') {
        return car.options.some(option =>
          option.name === 'Parking Assistant Pack Plus' || option.name === 'Parking Assistant Pack Professional',
        )
      }

      else if (x === 'Verwarmde zetels vooraan' || x === 'Verwarmde zetels vooraan en achteraan') {
        return car.options.some(option =>
          option.name === 'Verwarmde zetels vooraan' || option.name === 'Verwarmde zetels vooraan en achteraan',
        )
      }

      else {
        // Default filtering logic for other options
        return car.options.some(option => option.name === x)
      }
    }),
  )

  return result
})

const optionsToShow = (options: any) => {
  return options.filter((option: any) => prioOptions.includes(option.name))
}

// Format currency function
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>
