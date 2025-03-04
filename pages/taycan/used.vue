<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-1/4 p-4 bg-gray-100 h-[calc(100vh-40px)] overflow-y-auto">
      <h2 class="text-xl font-semibold mb-4">
        Filters
      </h2>

      <!-- Search by Name -->
      <div class="mb-4">
        <label class="block mb-1">Search:</label>
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
            Price (Low to High)
          </option>
          <option value="priceDesc">
            Price (High to Low)
          </option>
          <option value="km">
            Mileage (Low to High)
          </option>
          <option value="kmDesc">
            Mileage (High to Low)
          </option>
        </select>
      </div>

      <!-- Options Filter -->
      <div class="mb-4">
        <label class="block mb-1">Filter by Options:</label>
        <input
          v-model="optionSearch"
          type="text"
          placeholder="Search options"
          class="w-full p-2 border rounded mb-2">

        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="option in filteredOptions"
            :key="option"
            class="flex items-center py-1">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="selectedOptions"
                type="checkbox"
                :value="option"
                class="mr-2">
              <span class="text-sm">{{ option }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="w-3/4 p-4 h-[calc(100vh-40px)] overflow-y-auto">
      <h2 class="text-xl font-semibold mb-4">
        Available Cars {{ filteredCars.length ? `(${filteredCars.length})` : '' }}
      </h2>

      <div v-if="filteredCars.length">
        <!-- Grid Display for Cars -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(car, index) in filteredCars"
            :key="index"
            class="border p-4 rounded-lg shadow-sm bg-white">
            <a
              v-if="car.link"
              class="font-semibold"
              :href="car.link"
              target="_blank">
              {{ car.title || 'No Title' }}
            </a>
            <div v-else class="font-semibold">
              {{ car.title || 'No Title' }}
            </div>
            <p><strong>Price:</strong> {{ car.price || 'N/A' }}</p>
            <p><strong>KM:</strong> {{ car.km || 'N/A' }}</p>
            <p><strong>Power:</strong> {{ car.power || 'N/A' }}</p>
            <p><strong>Dealer:</strong> {{ car.dealer || 'N/A' }}</p>
            <div v-if="car.options?.length" class="mt-4">
              <p class="font-semibold">
                Options:
              </p>
              <ul class="list-disc pl-5 mt-2 text-sm">
                <li
                  v-for="option in car.options.slice(0, 5)"
                  :key="option"
                  class="text-gray-600">
                  {{ option }}
                </li>
                <li v-if="car.options.length > 5" class="text-gray-500 italic">
                  + {{ car.options.length - 5 }} more options
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
import type { Ref } from 'vue'

// Define the car type
interface Car {
  title: string | null
  link: string | null
  price: string | null
  km: string | null
  power: string | null
  dealer: string | null
  options: string[]
}

// Fetch data from API
const { data }: { data: Ref<Car[]> } = useFetch('/api/taycan/used')

// State variables
const searchQuery = ref('')
const maxPrice = ref<number | null>(null)
const sortOption = ref<'price' | 'priceDesc' | 'km' | 'kmDesc'>('price')
const selectedOptions = ref<string[]>([])
const optionSearch = ref('')

// Helper function to parse price
const parsePrice = (price: string | null): number => {
  return Number.parseFloat(price?.replace(/[^\d.]/g, '') || '0')
}

// Helper function to parse kilometers
const parseKm = (km: string | null): number => {
  return Number.parseFloat(km?.replace(/[^\d.]/g, '') || '0')
}

// Get all unique options sorted alphabetically
const allOptions = computed(() => {
  if (!data.value) return []

  const optionsSet = new Set<string>()
  data.value.forEach((car) => {
    if (car.options) {
      car.options.forEach(option => optionsSet.add(option))
    }
  })

  return Array.from(optionsSet).sort((a, b) => a.localeCompare(b))
})

// Filter options based on search
const filteredOptions = computed(() => {
  if (!optionSearch.value) return allOptions.value

  const search = optionSearch.value.toLowerCase()
  return allOptions.value.filter(option =>
    option.toLowerCase().includes(search),
  )
})

// Filtered cars
const filteredCars = computed(() => {
  if (!data.value) return []

  const cars = data.value.filter((car) => {
    const matchesSearch = !searchQuery.value || car.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) || false
    const matchesPrice = !maxPrice.value || parsePrice(car.price) <= maxPrice.value
    const matchesOptions = selectedOptions.value.length === 0
      || selectedOptions.value.every(option => car.options?.includes(option))

    return matchesSearch && matchesPrice && matchesOptions
  })

  // Sort based on selected option
  return cars.sort((a, b) => {
    switch (sortOption.value) {
      case 'price':
        return parsePrice(a.price) - parsePrice(b.price)
      case 'priceDesc':
        return parsePrice(b.price) - parsePrice(a.price)
      case 'km':
        return parseKm(a.km) - parseKm(b.km)
      case 'kmDesc':
        return parseKm(b.km) - parseKm(a.km)
      default:
        return 0
    }
  })
})
</script>
