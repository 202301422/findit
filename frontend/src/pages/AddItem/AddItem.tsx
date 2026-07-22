import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { 
  ShoppingBag, Search, Calendar, Ticket, Plus, Upload, 
  MapPin, Clock, ShieldAlert, BadgeInfo, Check, ArrowLeft
} from 'lucide-react'
import { clsx } from 'clsx'

import api from '@/utils/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const SELL_CATEGORIES = [
  'Electronics','Clothing & Accessories','Books & Documents','Furniture & Home',
  'Sports & Fitness','Vehicles & Parts','Musical Instruments','Gaming','Art & Collectibles','Other',
]
const PASS_CATEGORIES = ['Concert','Movie','Event','Other']
const FOUND_CATEGORIES = [
  'Electronics','Wearables','Accessories','Books & Documents','Grooming',
  'Money','ID Cards','Stationary','Sports & Fitness','Keys','Other',
]

type ListingType = 'product' | 'found'
type ProductType = 'pass' | 'ticket' | 'other'
type TicketType = 'Bus' | 'Train' | 'Plane'
type Photo = { id: string; file: File; preview: string }

const MAX_IMAGE_FILES = 5
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type WizardForm = {
  name: string
  category: string
  description: string
  productUrl: string
  eventDateTime: string
  venueArea: string
  venueCity: string
  venueState: string
  originArea: string
  originCity: string
  originState: string
  destArea: string
  destCity: string
  destState: string
  departureTime: string
  arrivalTime: string
  locationFound: string
  dateTimeFound: string
  usageYears: string
  usageMonths: string
  usageDays: string
  warrantyDuration: string
  warrantyUnit: string
}

const emptyForm: WizardForm = {
  name: '',
  category: '',
  description: '',
  productUrl: '',
  eventDateTime: '',
  venueArea: '',
  venueCity: '',
  venueState: '',
  originArea: '',
  originCity: '',
  originState: '',
  destArea: '',
  destCity: '',
  destState: '',
  departureTime: '',
  arrivalTime: '',
  locationFound: '',
  dateTimeFound: '',
  usageYears: '',
  usageMonths: '',
  usageDays: '',
  warrantyDuration: '',
  warrantyUnit: 'months',
}

function filled(value: string) {
  return value.trim().length > 0
}

function positivePrice(value: string) {
  const amount = Number.parseFloat(value)
  return !Number.isNaN(amount) && amount > 0
}

function positiveQuantity(value: string) {
  const count = Number.parseInt(value, 10)
  return !Number.isNaN(count) && count > 0
}

function isFutureDateTime(value: string) {
  if (!filled(value)) return false
  return new Date(value).getTime() > Date.now()
}

function isPastOrPresentDateTime(value: string) {
  if (!filled(value)) return false
  return new Date(value).getTime() <= Date.now() + 60000
}

function nowDateTimeLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function isArrivalAfterDeparture(departureTime: string, arrivalTime: string) {
  if (!filled(departureTime) || !filled(arrivalTime)) return true
  const departure = new Date(departureTime).getTime()
  const arrival = new Date(arrivalTime).getTime()
  if (Number.isNaN(departure) || Number.isNaN(arrival)) return false
  return arrival > departure
}

interface PhotoDropSectionProps {
  photos: Photo[]
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>
  error?: boolean
}

function PhotoDropSection({ photos, setPhotos, error }: PhotoDropSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const remaining = MAX_IMAGE_FILES - photos.length
    if (remaining <= 0) return

    const selectedFiles = Array.from(fileList)
    const accepted = selectedFiles.filter((file) =>
      ALLOWED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_SIZE_BYTES,
    )
    const rejectedCount = selectedFiles.length - accepted.length
    if (rejectedCount > 0) {
      toast.error('Only JPG, JPEG, PNG, or WEBP images up to 5 MB are allowed')
    }
    if (selectedFiles.length > remaining) {
      toast.error(`You can upload up to ${MAX_IMAGE_FILES} images`)
    }
    const nextPhotos = accepted.slice(0, remaining).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
    }))

    setPhotos((current) => [...current, ...nextPhotos])
  }

  const removePhoto = (id: string) => {
    const removed = photos.find((p) => p.id === id)
    if (removed) URL.revokeObjectURL(removed.preview)
    setPhotos((current) => current.filter((p) => p.id !== id))
  }

  return (
    <Card className={clsx(error && 'border-[var(--color-error-500)] bg-[var(--color-error-50)]/5')}>
      <h3 className="text-sm font-semibold mb-2">PHOTOS *</h3>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative w-20 h-20 rounded-[var(--radius-md)] border overflow-hidden bg-[var(--bg-tertiary)] border-[var(--border-secondary)]">
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/75 hover:bg-black/90 text-white cursor-pointer text-[10px]"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < MAX_IMAGE_FILES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 flex flex-col items-center justify-center border border-dashed rounded-[var(--radius-md)] border-[var(--border-primary)] hover:border-[var(--color-primary-500)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
            >
              <Plus size={20} />
              <span className="text-[10px] font-medium mt-1">Add</span>
            </button>
          )}
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          className={clsx(
            'border border-dashed p-6 text-center rounded-[var(--radius-lg)] cursor-pointer transition-all',
            dragOver ? 'border-[var(--color-primary-500)] bg-[var(--bg-secondary)]' : 'border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50'
          )}
        >
          <Upload className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
          <p className="text-sm font-semibold">Drop photos here or click to browse</p>
          <span className="text-xs text-[var(--text-tertiary)] mt-1 block">
            PNG, JPG, WEBP — up to 5MB ({photos.length} / {MAX_IMAGE_FILES} selected)
          </span>
        </div>
        {error && <span className="text-xs text-[var(--color-error-500)]">At least one photo is required</span>}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
    </Card>
  )
}

interface PricingCardSectionProps {
  listingType: ListingType | null
  productType: ProductType | null
  price: string
  setPrice: (v: string) => void
  originalPrice: string
  setOriginalPrice: (v: string) => void
  quantity: string
  setQuantity: (v: string) => void
  isNegotiable: boolean | null
  setIsNegotiable: (v: boolean) => void
  submitAttempted: boolean
  pricingTotal: number
  showOriginal?: boolean
  discount?: number | null
}

function PricingCardSection({
  listingType,
  productType,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  quantity,
  setQuantity,
  isNegotiable,
  setIsNegotiable,
  submitAttempted,
  pricingTotal,
  showOriginal = false,
  discount = null,
}: PricingCardSectionProps) {
  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold">PRICING & QUANTITY</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Input
          label={listingType === 'found' ? '' : (productType === 'pass' ? 'Price per Pass (₹) *' : (productType === 'ticket' ? 'Price per Ticket (₹) *' : 'Selling Price (₹) *'))}
          type="number"
          min="0"
          step="0.01"
          placeholder="₹ 0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={submitAttempted && !positivePrice(price) ? 'Valid price required' : undefined}
        />
        {showOriginal && (
          <Input
            label="Original Purchase Price (₹)"
            type="number"
            min="0"
            step="0.01"
            placeholder="₹ 0.00"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
          />
        )}
        <Input
          label="Quantity *"
          type="number"
          min="1"
          placeholder="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(/\D+/g, ''))}
          error={submitAttempted && !positiveQuantity(quantity) ? 'Quantity must be at least 1' : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Is price negotiable? *</label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={isNegotiable === true ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(true)}>Yes</Button>
          <Button type="button" size="sm" variant={isNegotiable === false ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(false)}>No</Button>
        </div>
        {submitAttempted && isNegotiable === null && <span className="text-xs text-[var(--color-error-500)] block">Please select an option</span>}
      </div>

      {discount !== null && (
        <div className="p-3 bg-[var(--bg-secondary)] text-xs rounded-[var(--radius-md)] border border-[var(--border-secondary)] text-[var(--text-secondary)]">
          {discount > 0
            ? `Selling at ${discount}% discount from original price.`
            : discount === 0
            ? 'Selling at the original price.'
            : `Selling at ${Math.abs(discount)}% above the original price.`}
        </div>
      )}

      {productType !== 'other' && pricingTotal > 0 && (
        <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--text-secondary)]">Total Listing Value:</span>
          <span className="text-lg font-bold text-[var(--color-primary-500)]">₹{pricingTotal.toLocaleString('en-IN')}</span>
        </div>
      )}
    </Card>
  )
}

export default function AddItem() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [listingType, setListingType] = useState<ListingType | null>(null)
  const [productType, setProductType] = useState<ProductType | null>(null)
  const [ticketType, setTicketType] = useState<TicketType>('Bus')
  const [hasWarranty, setHasWarranty] = useState<boolean | null>(null)
  const [isNegotiable, setIsNegotiable] = useState<boolean | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [originalPrice, setOriginalPrice] = useState('')
  const [form, setForm] = useState<WizardForm>(emptyForm)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setFormField<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }


  function buildMultiImageFormData(payload: Record<string, string>) {
    if (photos.length === 0) {
      throw new Error('At least one photo is required')
    }
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value)
    })
    photos.forEach((photo) => {
      formData.append('images', photo.file)
    })
    return formData
  }

  async function submitFoundListing() {
    const payload = buildMultiImageFormData({
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      venue: form.locationFound.trim(),
      dateTime: form.dateTimeFound,
    })
    await api.post('/found-products', payload)
  }

  async function submitPassListing() {
    const payload = buildMultiImageFormData({
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price,
      quantity,
      isNegotiable: String(isNegotiable),
      dateTime: form.eventDateTime,
      venue: JSON.stringify({
        area: form.venueArea.trim(),
        city: form.venueCity.trim(),
        state: form.venueState.trim(),
      }),
    })
    await api.post('/passes', payload)
  }

  async function submitTicketListing() {
    await api.post('/tickets', {
      ticketType,
      description: form.description.trim(),
      price,
      quantity,
      isNegotiable: String(isNegotiable),
      origin: JSON.stringify({
        area: form.originArea.trim(),
        city: form.originCity.trim(),
        state: form.originState.trim(),
      }),
      destination: JSON.stringify({
        area: form.destArea.trim(),
        city: form.destCity.trim(),
        state: form.destState.trim(),
      }),
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
    })
  }

  async function submitOtherListing() {
    const basePayload: Record<string, string> = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      sellingPrice: price,
      purchasePrice: originalPrice,
      productURL: form.productUrl.trim(),
      quantity,
      isNegotiable: String(isNegotiable),
      hasWarranty: String(hasWarranty),
      usageTime: JSON.stringify({
        years: form.usageYears || '0',
        months: form.usageMonths || '0',
        days: form.usageDays || '0',
      }),
    }
    if (hasWarranty === true) {
      basePayload.warrantyValue = form.warrantyDuration
      basePayload.warrantyUnit = form.warrantyUnit
    }
    const payload = buildMultiImageFormData(basePayload)
    await api.post('/sell-products', payload)
  }

  async function handleSubmitListing() {
    if (isSubmitting) return
    setSubmitAttempted(true)
    if (!isFinalStepValid) return

    setIsSubmitting(true)
    try {
      if (listingType === 'found') {
        await submitFoundListing()
        toast.success('Found item submitted successfully')
      } else if (productType === 'pass') {
        await submitPassListing()
        toast.success('Pass published successfully')
      } else if (productType === 'ticket') {
        await submitTicketListing()
        toast.success('Ticket published successfully')
      } else if (productType === 'other') {
        await submitOtherListing()
        toast.success('Item published successfully')
      } else {
        throw new Error('Unsupported item type')
      }
      navigate('/home')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to submit listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pricingValid = positivePrice(price) && positiveQuantity(quantity) && isNegotiable !== null

  const isFinalStepValid = useMemo(() => {
    if (listingType === 'found') {
      return (
        filled(form.name)
        && filled(form.category)
        && photos.length > 0
        && filled(form.locationFound)
        && isPastOrPresentDateTime(form.dateTimeFound)
      )
    }
    if (productType === 'pass') {
      return (
        filled(form.name)
        && filled(form.category)
        && photos.length > 0
        && isFutureDateTime(form.eventDateTime)
        && filled(form.venueArea)
        && filled(form.venueCity)
        && filled(form.venueState)
        && pricingValid
      )
    }
    if (productType === 'ticket') {
      return (
        filled(form.originArea)
        && filled(form.originCity)
        && filled(form.originState)
        && filled(form.destArea)
        && filled(form.destCity)
        && filled(form.destState)
        && filled(form.departureTime)
        && filled(form.arrivalTime)
        && isFutureDateTime(form.departureTime)
        && isArrivalAfterDeparture(form.departureTime, form.arrivalTime)
        && pricingValid
      )
    }
    if (productType === 'other') {
      const warrantyValid = hasWarranty === false
        || (hasWarranty === true && filled(form.warrantyDuration) && filled(form.warrantyUnit))
      return (
        filled(form.name)
        && filled(form.category)
        && photos.length > 0
        && hasWarranty !== null
        && warrantyValid
        && pricingValid
      )
    }
    return false
  }, [form, hasWarranty, isNegotiable, listingType, photos.length, price, productType, quantity, pricingValid])

  const wizardSteps = listingType === 'found'
    ? ['Listing Type', 'Details']
    : ['Listing Type', 'Item Type', 'Details']

  const totalSteps = wizardSteps.length
  const isFinalStep = step === totalSteps

  const canContinueStep1 = listingType !== null
  const canContinueStep2 = listingType === 'found' ? true : productType !== null

  const continueDisabled = step === 1
    ? !canContinueStep1
    : step === 2
      ? listingType === 'found' ? false : !canContinueStep2
      : !isFinalStepValid

  const submitLabel = useMemo(() => {
    if (listingType === 'found') return 'Submit Found Report'
    if (productType === 'pass') return 'Publish Pass'
    if (productType === 'ticket') return 'Publish Ticket'
    return 'Publish Item'
  }, [listingType, productType])

  const pricingTotal = useMemo(() => {
    const unit = Number.parseFloat(price) || 0
    const count = Number.parseInt(quantity, 10) || 0
    return unit * count
  }, [price, quantity])

  function handleBack() {
    if (step === 1) {
      navigate('/home')
      return
    }
    setStep((current) => current - 1)
  }

  function handleContinue() {
    if (isFinalStep) {
      void handleSubmitListing()
      return
    }
    if (step === 1 && canContinueStep1) {
      setStep(2)
      return
    }
    if (step === 2 && canContinueStep2 && listingType === 'product') {
      setStep(3)
    }
  }

  function getStepState(index: number) {
    const stepNumber = index + 1
    if (step > stepNumber) return 'complete'
    if (step === stepNumber) return 'active'
    return 'pending'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Add New Listing
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Fill in the details to publish your listing to Findit feed
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} iconLeft={<ArrowLeft size={14} />}>
          {step === 1 ? 'Back to Home' : 'Back'}
        </Button>
      </div>

      {/* Stepper bar */}
      <div className="flex items-center justify-between bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-[var(--radius-lg)] p-3 sm:px-6 shadow-[var(--shadow-card)]">
        {wizardSteps.map((label, idx) => {
          const state = getStepState(idx)
          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <span
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  state === 'complete' && 'bg-[var(--color-success-500)] text-white',
                  state === 'active' && 'bg-[var(--color-primary-500)] text-white shadow-xs',
                  state === 'pending' && 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                )}
              >
                {state === 'complete' ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </span>
              <span
                className={clsx(
                  'text-xs font-medium hidden sm:inline',
                  state === 'active' ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-tertiary)]'
                )}
              >
                {label}
              </span>
              {idx < wizardSteps.length - 1 && (
                <span className="w-8 sm:w-16 h-px bg-[var(--border-primary)] mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Listing Type Choice */}
      {step === 1 && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">What are you listing?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setListingType('product')}
              className={clsx(
                'flex flex-col items-center justify-center p-6 rounded-[var(--radius-lg)] border text-center transition-all cursor-pointer group',
                listingType === 'product'
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5 ring-1 ring-[var(--color-primary-500)]'
                  : 'border-[var(--border-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag size={22} />
              </div>
              <strong className="text-sm font-semibold block text-[var(--text-primary)]">Product for Sale</strong>
              <span className="text-xs text-[var(--text-secondary)] mt-1">Sell passes, travel tickets, or items</span>
            </button>

            <button
              type="button"
              onClick={() => setListingType('found')}
              className={clsx(
                'flex flex-col items-center justify-center p-6 rounded-[var(--radius-lg)] border text-center transition-all cursor-pointer group',
                listingType === 'found'
                  ? 'border-[var(--color-success-500)] bg-[var(--color-success-500)]/5 ring-1 ring-[var(--color-success-500)]'
                  : 'border-[var(--border-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10 text-[var(--color-success-600)] mb-3 group-hover:scale-110 transition-transform">
                <Search size={22} />
              </div>
              <strong className="text-sm font-semibold block text-[var(--text-primary)]">Found Product</strong>
              <span className="text-xs text-[var(--text-secondary)] mt-1">Report an item you retrieved on campus</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end">
            <Button type="button" onClick={handleContinue} disabled={!canContinueStep1}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 (Product Type Choice) */}
      {step === 2 && listingType === 'product' && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Select Item Category</h3>
          <div className="space-y-3">
            {[
              { id: 'pass', label: 'Event Pass', desc: 'Concert, festival, movie, or other entry passes', icon: Calendar },
              { id: 'ticket', label: 'Travel Ticket', desc: 'Bus, train, shuttle, or plane tickets', icon: Ticket },
              { id: 'other', label: 'Other General Item', desc: 'Electronics, textbooks, accessories, clothing, etc.', icon: ShoppingBag }
            ].map((pType) => {
              const Icon = pType.icon
              const isSelected = productType === pType.id
              return (
                <button
                  key={pType.id}
                  type="button"
                  onClick={() => setProductType(pType.id as ProductType)}
                  className={clsx(
                    'w-full flex items-center gap-4 p-4 rounded-[var(--radius-md)] border text-left transition-all cursor-pointer group',
                    isSelected
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5 ring-1 ring-[var(--color-primary-500)]'
                      : 'border-[var(--border-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 flex items-center justify-center rounded-full shrink-0 group-hover:scale-105 transition-transform',
                    isSelected ? 'bg-[var(--color-primary-500)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  )}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <strong className="text-sm font-semibold block text-[var(--text-primary)]">{pType.label}</strong>
                    <span className="text-xs text-[var(--text-secondary)] mt-0.5 block">{pType.desc}</span>
                  </div>
                  {isSelected && <span className="ml-auto text-[var(--color-primary-500)] font-bold text-sm">✓</span>}
                </button>
              )
            })}
          </div>

          <div className="pt-4 border-t border-[var(--border-primary)] flex justify-between">
            <Button variant="secondary" onClick={handleBack}>Back</Button>
            <Button type="button" onClick={handleContinue} disabled={!canContinueStep2}>Continue</Button>
          </div>
        </Card>
      )}

      {/* Step 2 (Found Product details) OR Step 3 (Product Category Details) */}
      {((step === 2 && listingType === 'found') || (step === 3 && listingType === 'product')) && (
        <div className="space-y-6">
          {/* Found specific banner */}
          {listingType === 'found' && (
            <div className="flex gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10 text-xs text-[var(--color-success-600)] dark:text-[var(--color-success-500)] border border-[var(--color-success-500)]/20 animate-fade-in">
              <BadgeInfo size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-sm">Reporting a Found Item</strong>
                <p className="mt-0.5">Please specify precise landmarks and upload documents safely (blur personal identification marks if necessary).</p>
              </div>
            </div>
          )}

          {/* Details input section */}
          {listingType === 'found' ? (
            /* ---- FOUND FORM DETAILS ---- */
            <div className="space-y-6 animate-slide-up">
              <Card className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Item Details</h3>
                <Input
                  label="Item Name *"
                  placeholder="e.g. Red Leather Wallet"
                  value={form.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                  error={submitAttempted && !filled(form.name) ? 'Item name is required' : undefined}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setFormField('category', e.target.value)}
                    className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                  >
                    <option value="" disabled>Select category</option>
                    {FOUND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {submitAttempted && !filled(form.category) && <span className="text-xs text-[var(--color-error-500)] block">Category is required</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    placeholder="Describe markings, color, brand, location specifics..."
                    className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[90px]"
                    value={form.description}
                    onChange={(e) => setFormField('description', e.target.value)}
                  />
                </div>
              </Card>

              <PhotoDropSection photos={photos} setPhotos={setPhotos} error={submitAttempted && photos.length === 0} />

              <Card className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Where & When Found</h3>
                <Input
                  label="Location Found *"
                  placeholder="e.g. Central Library, 2nd floor studying desk"
                  value={form.locationFound}
                  onChange={(e) => setFormField('locationFound', e.target.value)}
                  error={submitAttempted && !filled(form.locationFound) ? 'Location is required' : undefined}
                  iconLeft={<MapPin size={16} />}
                />
                <Input
                  label="Date & Time Found *"
                  type="datetime-local"
                  max={nowDateTimeLocal()}
                  value={form.dateTimeFound}
                  onChange={(e) => setFormField('dateTimeFound', e.target.value)}
                  error={
                    submitAttempted
                      ? !filled(form.dateTimeFound)
                        ? 'Date and Time is required'
                        : !isPastOrPresentDateTime(form.dateTimeFound)
                        ? 'Date must be in the past or present'
                        : undefined
                      : undefined
                  }
                  iconLeft={<Clock size={16} />}
                />
              </Card>
            </div>
          ) : (
            /* ---- PRODUCT DETAILS FORM (ByCategory) ---- */
            <div className="space-y-6 animate-slide-up">
              {productType === 'pass' && (
                <>
                  <Card className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Event Pass Specifics</h3>
                    <Input
                      label="Pass Name *"
                      placeholder="e.g. Spring Fest Concert VIP Pass"
                      value={form.name}
                      onChange={(e) => setFormField('name', e.target.value)}
                      error={submitAttempted && !filled(form.name) ? 'Pass name is required' : undefined}
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Category *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setFormField('category', e.target.value)}
                        className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                      >
                        <option value="" disabled>Select category</option>
                        {PASS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {submitAttempted && !filled(form.category) && <span className="text-xs text-[var(--color-error-500)] block">Category is required</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        placeholder="Additional details such as entry gates, inclusions..."
                        className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[90px]"
                        value={form.description}
                        onChange={(e) => setFormField('description', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Event DateTime *"
                      type="datetime-local"
                      min={nowDateTimeLocal()}
                      value={form.eventDateTime}
                      onChange={(e) => setFormField('eventDateTime', e.target.value)}
                      error={submitAttempted && !isFutureDateTime(form.eventDateTime) ? 'DateTime must be in future' : undefined}
                    />
                    <div className="space-y-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block">Venue Address</span>
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Area" value={form.venueArea} onChange={(e) => setFormField('venueArea', e.target.value)} />
                        <Input placeholder="City" value={form.venueCity} onChange={(e) => setFormField('venueCity', e.target.value)} />
                        <Input placeholder="State" value={form.venueState} onChange={(e) => setFormField('venueState', e.target.value)} />
                      </div>
                    </div>
                  </Card>
                  <PhotoDropSection photos={photos} setPhotos={setPhotos} error={submitAttempted && photos.length === 0} />
                  <PricingCardSection
                    listingType={listingType}
                    productType={productType}
                    price={price}
                    setPrice={setPrice}
                    originalPrice={originalPrice}
                    setOriginalPrice={setOriginalPrice}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    isNegotiable={isNegotiable}
                    setIsNegotiable={setIsNegotiable}
                    submitAttempted={submitAttempted}
                    pricingTotal={pricingTotal}
                  />
                </>
              )}

              {productType === 'ticket' && (
                <>
                  <Card className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Travel Ticket Info</h3>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Transport Type *</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Bus', 'Train', 'Plane'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTicketType(t as TicketType)}
                            className={clsx(
                              'h-11 rounded-[var(--radius-md)] border flex items-center justify-center font-semibold text-sm cursor-pointer transition-all',
                              ticketType === t ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5 text-[var(--text-primary)]' : 'border-[var(--border-primary)] text-[var(--text-secondary)]'
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block">Journey Departure Origin *</span>
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Area" value={form.originArea} onChange={(e) => setFormField('originArea', e.target.value)} />
                        <Input placeholder="City" value={form.originCity} onChange={(e) => setFormField('originCity', e.target.value)} />
                        <Input placeholder="State" value={form.originState} onChange={(e) => setFormField('originState', e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block">Journey Destination *</span>
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Area" value={form.destArea} onChange={(e) => setFormField('destArea', e.target.value)} />
                        <Input placeholder="City" value={form.destCity} onChange={(e) => setFormField('destCity', e.target.value)} />
                        <Input placeholder="State" value={form.destState} onChange={(e) => setFormField('destState', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Departure Time *"
                        type="datetime-local"
                        min={nowDateTimeLocal()}
                        value={form.departureTime}
                        onChange={(e) => setFormField('departureTime', e.target.value)}
                        error={submitAttempted && !isFutureDateTime(form.departureTime) ? 'Must be future datetime' : undefined}
                      />
                      <Input
                        label="Arrival Time *"
                        type="datetime-local"
                        value={form.arrivalTime}
                        onChange={(e) => setFormField('arrivalTime', e.target.value)}
                        error={submitAttempted && !isArrivalAfterDeparture(form.departureTime, form.arrivalTime) ? 'Must be after departure' : undefined}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Journey Details / description</label>
                      <textarea
                        placeholder="Booking notes, seat allocation, cancellation rules..."
                        className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[90px]"
                        value={form.description}
                        onChange={(e) => setFormField('description', e.target.value)}
                      />
                    </div>
                  </Card>
                  <PricingCardSection
                    listingType={listingType}
                    productType={productType}
                    price={price}
                    setPrice={setPrice}
                    originalPrice={originalPrice}
                    setOriginalPrice={setOriginalPrice}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    isNegotiable={isNegotiable}
                    setIsNegotiable={setIsNegotiable}
                    submitAttempted={submitAttempted}
                    pricingTotal={pricingTotal}
                  />
                </>
              )}

              {productType === 'other' && (
                <>
                  <Card className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Product Details</h3>
                    <Input
                      label="Product Name *"
                      placeholder="e.g. iPad Pro M2 11-inch"
                      value={form.name}
                      onChange={(e) => setFormField('name', e.target.value)}
                      error={submitAttempted && !filled(form.name) ? 'Product name is required' : undefined}
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Category *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setFormField('category', e.target.value)}
                        className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                      >
                        <option value="" disabled>Select category</option>
                        {SELL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {submitAttempted && !filled(form.category) && <span className="text-xs text-[var(--color-error-500)] block">Category is required</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        placeholder="Condition description, damage specifics, accessories included..."
                        className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[90px]"
                        value={form.description}
                        onChange={(e) => setFormField('description', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Original Webpage URL (optional)"
                      placeholder="https://amazon.in/dp/..."
                      value={form.productUrl}
                      onChange={(e) => setFormField('productUrl', e.target.value)}
                    />
                  </Card>

                  <PhotoDropSection photos={photos} setPhotos={setPhotos} error={submitAttempted && photos.length === 0} />

                  <Card className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Usage History</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="Years" type="number" min="0" placeholder="0" value={form.usageYears} onChange={(e) => setFormField('usageYears', e.target.value)} />
                      <Input label="Months" type="number" min="0" placeholder="0" value={form.usageMonths} onChange={(e) => setFormField('usageMonths', e.target.value)} />
                      <Input label="Days" type="number" min="0" placeholder="0" value={form.usageDays} onChange={(e) => setFormField('usageDays', e.target.value)} />
                    </div>
                  </Card>

                  <Card className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Warranty</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold block text-[var(--text-secondary)]">Is there active warranty left? *</label>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant={hasWarranty === true ? 'primary' : 'secondary'} onClick={() => setHasWarranty(true)}>Yes</Button>
                        <Button type="button" size="sm" variant={hasWarranty === false ? 'primary' : 'secondary'} onClick={() => setHasWarranty(false)}>No</Button>
                      </div>
                      {submitAttempted && hasWarranty === null && <span className="text-xs text-[var(--color-error-500)] block">Please select an option</span>}
                    </div>

                    {hasWarranty === true && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <Input
                          label="Warranty Duration *"
                          placeholder="e.g. 6"
                          value={form.warrantyDuration}
                          onChange={(e) => setFormField('warrantyDuration', e.target.value)}
                          error={submitAttempted && !filled(form.warrantyDuration) ? 'Duration required' : undefined}
                        />
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Unit *</label>
                          <select
                            value={form.warrantyUnit}
                            onChange={(e) => setFormField('warrantyUnit', e.target.value)}
                            className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                          >
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </Card>

                  <PricingCardSection
                    listingType={listingType}
                    productType={productType}
                    price={price}
                    setPrice={setPrice}
                    originalPrice={originalPrice}
                    setOriginalPrice={setOriginalPrice}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    isNegotiable={isNegotiable}
                    setIsNegotiable={setIsNegotiable}
                    submitAttempted={submitAttempted}
                    pricingTotal={pricingTotal}
                    showOriginal
                    discount={
                      Number(originalPrice) > 0 && Number(price) >= 0
                        ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
                        : null
                    }
                  />
                </>
              )}
            </div>
          )}


          <div className="pt-4 border-t border-[var(--border-primary)] space-y-3">
            {submitAttempted && isFinalStep && !isFinalStepValid && (
              <div className="flex gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-error-50)] dark:bg-[var(--color-error-500)]/10 text-xs text-[var(--color-error-600)] dark:text-[var(--color-error-500)] border border-[var(--color-error-500)]/20">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <p>Please double-check all required forms (*). Make sure you have loaded at least one photo.</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>Back</Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleContinue}
                loading={isSubmitting}
                disabled={isSubmitting || (!isFinalStep && continueDisabled)}
              >
                {isFinalStep ? submitLabel : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
