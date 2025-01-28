<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-1/4 p-4 bg-gray-100">
      <h2 class="text-xl font-semibold mb-4">
        Options
      </h2>

      <!-- Search by Name -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name"
          class="w-full p-2 border rounded">
      </div>

      <!-- Price Filter -->
      <div class="mb-4">
        <label class="block mb-1">Max Price:</label>
        <input
          v-model.number="maxPrice"
          type="number"
          placeholder="Enter max price"
          class="w-full p-2 border rounded">
      </div>

      <!-- Sort Options -->
      <div class="mb-4">
        <label class="block mb-1">Sort By:</label>
        <select v-model="sortOption" class="w-full p-2 border rounded">
          <option value="price">
            Price
          </option>
          <option value="prioOptions">
            Most Priority Options
          </option>
        </select>
      </div>

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
              <p><strong>Priority Options:</strong> ({{ car.options.filter(o => prioOptions.includes(o)).length }}/{{ prioOptions.length }})</p>

              <p class="font-semibold mt-2">
                Included Options:
              </p>
              <ul class="list-disc pl-5">
                <li
                  v-for="option in prioOptions.filter(o => car.options.includes(o))"
                  :key="option"
                  class="flex items-center">
                  <span class="text-green-500 mr-2">✔️</span> {{ option }}
                </li>
              </ul>

              <p class="font-semibold mt-2">
                Missing Options:
              </p>
              <ul class="list-disc pl-5">
                <li
                  v-for="option in prioOptions.filter(o => !car.options.includes(o))"
                  :key="option"
                  class="flex items-center">
                  <span class="text-red-500 mr-2">❌</span> {{ option }}
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
interface Car {
  title: string | null
  link: string | null
  price: string | null
  km: string | null
  power: string | null
  dealer: string | null
  options: string[] | null
}

// Priority options
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
  'Interieur elementen met kristalafwerking \"CraftedClarity\"',
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
]

// Default selected options
const selectedOptions = ref<string[]>([
  'Adaptieve ophanging Professional',
  'BMW Iconic Glow Exterieur Pack',
  'Driving Assistant Pack Professional',
  'Parking Assistant Pack Professional',
  'Panoramisch schuifdak',
  'M sportstuur',
  'M veiligheidsgordels',
  'Verwarmd stuur',
  'Sfeerverlichting',
])

// State variables
const searchQuery = ref('')
const maxPrice = ref<number | null>(null)
const sortOption = ref<'price' | 'prioOptions'>('price')

// Compute unique and sorted options
const optionsSet = computed(() => {
  const set = new Set<string>()
  data.value?.forEach((car: Car) => {
    car.options?.forEach(option => set.add(option))
  })
  return set
})

const prioSortedOptions = computed(() => {
  return _.intersection(prioOptions, Array.from(optionsSet.value))
})

const remainingSortedOptions = computed(() => {
  return _.difference(Array.from(optionsSet.value), prioOptions)
})

// Filtered cars
const filteredCars = computed(() => {
  const cars = (data.value || []).filter((car: Car) => {
    const matchesOptions = selectedOptions.value.every(option => car.options?.includes(option))
    const matchesSearch = car.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) || false
    const matchesPrice = !maxPrice.value || Number.parseFloat(car.price?.replace(/[^\d.]/g, '') || '0') <= maxPrice.value

    return matchesOptions && matchesSearch && matchesPrice
  })

  if (sortOption.value === 'price') {
    return cars.sort((a, b) => {
      const priceA = Number.parseFloat(a.price?.replace(/[^\d.]/g, '') || '0')
      const priceB = Number.parseFloat(b.price?.replace(/[^\d.]/g, '') || '0')
      return priceA - priceB
    })
  }
  else {
    return cars.sort((a, b) => {
      const prioCountA = a.options?.filter(o => prioOptions.includes(o)).length || 0
      const prioCountB = b.options?.filter(o => prioOptions.includes(o)).length || 0
      return prioCountB - prioCountA
    })
  }
})
</script>
