<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-1/4 p-4 bg-gray-100">
      <h2 class="text-xl font-semibold mb-4">
        Options
      </h2>

      <!-- Prioritized Options -->
      <div v-for="option in prioSortedOptions" :key="`prio-${option}`" class="mb-2">
        <label class="flex items-center">
          <input
            v-model="selectedOptions"
            type="checkbox"
            :value="option"
            class="mr-2">
          {{ option }}
        </label>
      </div>

      <!-- Space/Divider -->
      <hr class="my-4 border-gray-300">

      <!-- Remaining Options -->
      <div v-for="option in remainingSortedOptions" :key="`remaining-${option}`" class="mb-2">
        <label class="flex items-center">
          <input
            v-model="selectedOptions"
            type="checkbox"
            :value="option"
            class="mr-2">
          {{ option }}
        </label>
      </div>
    </div>

    <!-- Main Content -->
    <div class="w-3/4 p-4">
      <h2 class="text-xl font-semibold mb-4">
        Filtered Cars {{ filteredCars.length ? `(${filteredCars.length})` : '' }}
      </h2>
      <div v-if="filteredCars.length">
        <!-- Grid Display for Cars -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="car in filteredCars"
            class="border p-4 rounded-lg shadow-sm bg-white">
            <a class="font-semibold" :href="car.link">
              {{ car.title || 'No Title' }}
            </a>
            <p><strong>Price:</strong> {{ car.price || 'N/A' }}</p>
            <p><strong>KM:</strong> {{ car.km || 'N/A' }}</p>
            <p><strong>Power:</strong> {{ car.power || 'N/A' }}</p>
            <p><strong>Dealer:</strong> {{ car.dealer || 'N/A' }}</p>
            <div v-if="car.options?.length">
              <p><strong>Priority Options:</strong></p>
              <ul class="list-disc pl-5">
                <li
                  v-for="option in car.options.filter(o => prioOptions.includes(o))"
                  :key="option">
                  {{ option }}
                </li>
              </ul>
              <p v-if="car.options.length > prioOptions.length">
                <strong>Other Options:</strong>
              </p>
              <ul
                v-if="car.options.length > prioOptions.length"
                class="list-disc pl-5">
                <li
                  v-for="option in car.options.filter(o => !prioOptions.includes(o))"
                  :key="option">
                  {{ option }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p>No cars match your selection.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import _ from 'lodash'

// Fetch data from API
const { data } = useFetch('/api/i5/used')

// Define the car type
type Car = {
  title: string | null
  link: string | null
  price: string | null
  km: string | null
  dealer: string | null
  options: string[] | null
}

// Priority options to display at the top and in car details
const prioOptions = [
  'Actieve ventilatie vooraan',
  'Adaptieve ophanging Professional',
  'Aanhangerkoppeling (elektrisch wegklapbaar)',
  'Automatische bediening van de achterklep',
  'BMW Iconic Glow Exterieur Pack',
  'BMW IconicSounds Electric',
  'BMW Live Cockpit Professional (GPS)',
  'Bowers & Wilkins Surround Sound System',
  'Comforttoegang',
  'Comfortzetels vooraan met elektrische regeling en geheugenfunctie',
  'Driving Assistant Pack Professional',
  'Elektronisch gestuurde airconditioning, 4-zoneregeling',
  'Flexible Fast Charger (Mode 2)',
  'Harman Kardon Surround Sound System',
  'Hemelbekleding in Anthrazit',
  'Interieur elementen met kristalafwerking \'CraftedClarity\'',
  'M sportstuur',
  'M veiligheidsgordels',
  'Panoramisch schuifdak',
  'Parking Assistant Pack Professional',
  'Sfeerverlichting',
  'Snellaadkabel tot 22kW (Mode 3)',
  'Snelladen AC (wisselstroom) meerfasig',
  'Verwarmd stuur',
  'Verwarmde zetels vooraan',
  'Verwarmde zetels vooraan en achteraan',
  'Zonnewerend glas achteraan',
]

// Store selected options from the sidebar (default enabled)
const selectedOptions = ref<string[]>([
  'Actieve ventilatie vooraan',
  'Adaptieve ophanging Professional',
  'Automatische bediening van de achterklep',
  'BMW Iconic Glow Exterieur Pack',
  'BMW IconicSounds Electric',
  'BMW Live Cockpit Professional (GPS)',
  'BMW Live Cockpit Professional (GPS)',
  'Bowers & Wilkins Surround Sound System',
  'Comforttoegang',
  'Comfortzetels vooraan met elektrische regeling en geheugenfunctie',
  'Driving Assistant Pack Professional',
  'Elektronisch gestuurde airconditioning, 4-zoneregeling',
  'Flexible Fast Charger (Mode 2)',
  'Hemelbekleding in Anthrazit',
  'Interieur elementen met kristalafwerking \'CraftedClarity\'',
  // 'Lendensteun voor zetels vooraan',
  'M sportstuur',
  'M veiligheidsgordels',
  'Panoramisch schuifdak',
  'Parking Assistant Pack Professional',
  'Sfeerverlichting',
  'Snellaadkabel tot 22kW (Mode 3)',
  'Snelladen AC (wisselstroom) meerfasig',
  'Verwarmd stuur',
  'Verwarmde zetels vooraan en achteraan',
  'Zonnewerend glas achteraan',
])

// Get all unique options and sort them alphabetically
const prioSortedOptions = computed(() => {
  const optionsSet = new Set<string>()
  data.value?.forEach((car: Car) => {
    if (car.options) {
      car.options.forEach(option => optionsSet.add(option))
    }
  })

  const allOptions = Array.from(optionsSet)
  return _.orderBy(prioOptions.filter(option => allOptions.includes(option)), x => x)
})

const remainingSortedOptions = computed(() => {
  const optionsSet = new Set<string>()
  data.value?.forEach((car: Car) => {
    if (car.options) {
      car.options.forEach(option => optionsSet.add(option))
    }
  })

  const allOptions = Array.from(optionsSet)
  return _.orderBy(allOptions.filter(option => !prioOptions.includes(option)).sort(), x => x)
})

const sortedOptions = computed(() => {
  return [...prioSortedOptions.value, ...remainingSortedOptions.value]
})

// Filter cars based on selected options and sort by price
// Filter cars based on selected options and sort by price (smallest to largest)
const filteredCars = computed(() => {
  const cars = data.value?.filter((car: Car) =>
    selectedOptions.value.every(option => car.options?.includes(option)),
  ) || []

  // Sort the cars by price (assuming price is a string representing a number)
  return cars.sort((a, b) => {
    // Clean and parse the price values
    const cleanPrice = (price: string | null) => {
      if (!price) return 0
      return Number.parseFloat(price.replace(/[^\d.-]/g, '')) // Remove non-numeric characters
    }

    const priceA = cleanPrice(a.price)
    const priceB = cleanPrice(b.price)

    // Sorting from smallest to largest (ascending order)
    return priceA - priceB
  })
})
</script>
