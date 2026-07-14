import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import api from '../../utils/api'
import '../../styles/variables.css'
import './AddItem.css'

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
  warrantyUnit: '',
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

function isArrivalAfterDeparture(departureTime: string, arrivalTime: string) {
  if (!filled(departureTime) || !filled(arrivalTime)) return true

  const departure = new Date(departureTime).getTime()
  const arrival = new Date(arrivalTime).getTime()

  if (Number.isNaN(departure) || Number.isNaN(arrival)) return false

  return arrival > departure
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
  const [quantity, setQuantity] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [form, setForm] = useState<WizardForm>(emptyForm)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setFormField<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function getPrimaryPhoto() {
    return photos[0]
  }

  /**
   * Builds FormData for endpoints that accept a SINGLE image.
   * Used by: /passes
   * Backend middleware: upload.single("image")
   * Field name: "image" (singular)
   */
  function buildSingleImageFormData(payload: Record<string, string>) {
    const photo = getPrimaryPhoto()

    if (!photo) {
      throw new Error('At least one photo is required')
    }

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value)
    })
    formData.append('image', photo.file)

    return formData
  }

  /**
   * Builds FormData for endpoints that accept MULTIPLE images.
   * Used by: /found-products, /sell-products
   * Backend middleware: upload.array("images", MAX_IMAGES)
   * Field name: "images" (plural) — all photos appended under the same key
   */
  function buildMultiImageFormData(payload: Record<string, string>) {
    if (photos.length === 0) {
      throw new Error('At least one photo is required')
    }

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value)
    })
    // Append every selected photo under the field name "images"
    // This matches upload.array("images", MAX_IMAGES) on the backend
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
    const payload = buildSingleImageFormData({
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
    // Uses buildMultiImageFormData — appends files as "images" (plural)
    // to match the backend route: upload.array("images", MAX_IMAGES)

    // Build the base payload without warranty fields
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
        years: form.usageYears,
        months: form.usageMonths,
        days: form.usageDays,
      }),
    }

    // Only include warrantyValue and warrantyUnit when hasWarranty is explicitly true.
    // Omitting them entirely prevents "" from reaching the backend enum validator.
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

    if (!isFinalStepValid) {
      return
    }

    if (listingType === 'found') {
      try {
        setIsSubmitting(true)
        await submitFoundListing()
        toast.success('Found item submitted successfully')
        navigate('/home')
      } catch (error) {
        toast.error((error as { message?: string })?.message || 'Failed to submit found item')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (productType === 'pass') {
      try {
        setIsSubmitting(true)
        await submitPassListing()
        toast.success('Pass published successfully')
        navigate('/home')
      } catch (error) {
        toast.error((error as { message?: string })?.message || 'Failed to publish pass')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (productType === 'ticket') {
      try {
        setIsSubmitting(true)
        await submitTicketListing()
        toast.success('Ticket published successfully')
        navigate('/home')
      } catch (error) {
        toast.error((error as { message?: string })?.message || 'Failed to publish ticket')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (productType === 'other') {
      try {
        setIsSubmitting(true)
        await submitOtherListing()
        toast.success('Item published successfully')
        navigate('/home')
      } catch (error) {
        toast.error((error as { message?: string })?.message || 'Failed to publish item')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    toast.error('This listing type is not connected to the backend yet.')
  }

  const pricingValid = positivePrice(price) && positiveQuantity(quantity) && isNegotiable !== null

  const isFinalStepValid = useMemo(() => {
    if (listingType === 'found') {
      return (
        filled(form.name)
        && filled(form.category)
        && photos.length > 0
        && filled(form.locationFound)
        && filled(form.dateTimeFound)
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
  }, [form, hasWarranty, isNegotiable, listingType, photos.length, price, productType, quantity])

  const wizardSteps = listingType === 'found'
    ? ['Listing Type', 'Details']
    : ['Listing Type', 'Item Type', 'Details']

  const totalSteps = wizardSteps.length
  const isFinalStep = step === totalSteps

  const canContinueStep1 = listingType !== null
  const canContinueStep2 = listingType === 'found' ? true : productType !== null

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

  function renderStepOne() {
    return (
      <section className="wizard-card">
        <h2 className="wizard-card__title">WHAT ARE YOU LISTING?</h2>
        <div className="choice-grid choice-grid--two">
          <button
            className={`choice-tile ${listingType === 'product' ? 'choice-tile--selected' : ''}`}
            onClick={() => setListingType('product')}
            type="button"
          >
            <span className="choice-tile__icon choice-tile__icon--sale">👜</span>
            <span className="choice-tile__body">
              <strong>Product for Sale</strong>
              <span>Sell passes, tickets, or any item</span>
            </span>
            {listingType === 'product' ? <span className="choice-tile__check">✓</span> : null}
          </button>

          <button
            className={`choice-tile ${listingType === 'found' ? 'choice-tile--selected choice-tile--selected-green' : ''}`}
            onClick={() => setListingType('found')}
            type="button"
          >
            <span className="choice-tile__icon choice-tile__icon--found">🏷️</span>
            <span className="choice-tile__body">
              <strong>Found Product</strong>
              <span>Report something you found</span>
            </span>
            {listingType === 'found' ? <span className="choice-tile__check choice-tile__check--green">✓</span> : null}
          </button>
        </div>

        <button
          className="primary-button primary-button--full"
          onClick={handleContinue}
          type="button"
          disabled={!canContinueStep1}
        >
          Continue →
        </button>
      </section>
    )
  }

  function renderStepTwo() {
    if (listingType === 'found') {
      return (
        <>
          <div className="wizard-banner wizard-banner--green">
            <span className="wizard-banner__icon">🏷️</span>
            <div>
              <strong>Reporting a Found Item</strong>
              <p>Provide clear details and a photo to help the owner identify and claim their item.</p>
            </div>
          </div>

          <section className="wizard-card">
            <h2 className="wizard-card__title">ITEM DETAILS</h2>
            <div className="stack">
              <Field
                error={submitAttempted && !filled(form.name)}
                icon="📦"
                label="Item Name"
                onChange={(value) => setFormField('name', value)}
                placeholder="e.g. Black leather wallet"
                value={form.name}
              />
              <SelectFieldFound
                error={submitAttempted && !filled(form.category)}
                label="Category"
                onChange={(value) => setFormField('category', value)}
                placeholder="Select category"
                value={form.category}
              />
              <TextAreaField
                label="Description"
                onChange={(value) => setFormField('description', value)}
                placeholder="Describe the item — color, brand, markings, condition when found..."
                value={form.description}
              />
            </div>
          </section>

          <PhotoDrop
            error={submitAttempted && photos.length === 0}
            helper={`PNG, JPG, WEBP � up to ${MAX_IMAGE_FILES} images`}
            label="PHOTO"
            onPhotosChange={setPhotos}
            photos={photos}
            required
          />

          <section className="wizard-card">
            <h2 className="wizard-card__title">WHERE & WHEN FOUND</h2>
            <div className="stack">
              <Field
                error={submitAttempted && !filled(form.locationFound)}
                icon="📍"
                label="Venue / Location Found"
                onChange={(value) => setFormField('locationFound', value)}
                placeholder="e.g. Central Park near the fountain, Gate 3B at Airport"
                value={form.locationFound}
              />
              <Field
                error={submitAttempted && !filled(form.dateTimeFound)}
                icon="🕒"
                label="Date & Time Found"
                onChange={(value) => setFormField('dateTimeFound', value)}
                placeholder="mm/dd/yyyy --:-- --"
                type="datetime-local"
                value={form.dateTimeFound}
              />
            </div>
          </section>
        </>
      )
    }

    return (
      <section className="wizard-card">
        <h2 className="wizard-card__title">WHAT TYPE OF ITEM ARE YOU SELLING?</h2>
        <div className="choice-list">
          <ChoiceRow
            active={productType === 'pass'}
            description="Concert, movie, event or other passes"
            icon="🎵"
            label="Event Pass"
            onSelect={() => setProductType('pass')}
          />
          <ChoiceRow
            active={productType === 'ticket'}
            description="Bus, train or plane tickets"
            icon="🎫"
            label="Travel Ticket"
            onSelect={() => setProductType('ticket')}
          />
          <ChoiceRow
            active={productType === 'other'}
            description="Electronics, clothing, furniture, etc."
            icon="📦"
            label="Other Item"
            onSelect={() => setProductType('other')}
          />
        </div>
      </section>
    )
  }

  function renderStepThree() {
    if (productType === 'pass') {
      return (
        <>
          <section className="wizard-card">
            <h2 className="wizard-card__title">EVENT PASS DETAILS</h2>
            <div className="stack">
              <Field
                error={submitAttempted && !filled(form.name)}
                icon="🎵"
                label="Pass Name"
                onChange={(value) => setFormField('name', value)}
                placeholder="e.g. Taylor Swift Concert Pass"
                value={form.name}
              />
              <SelectFieldPass
                error={submitAttempted && !filled(form.category)}
                label="Category"
                onChange={(value) => setFormField('category', value)}
                placeholder="Select category"
                value={form.category}
              />
              <TextAreaField
                label="Description"
                onChange={(value) => setFormField('description', value)}
                placeholder="Describe the pass — seat details, perks, restrictions..."
                value={form.description}
              />
              <PhotoDrop
                error={submitAttempted && photos.length === 0}
                helper={`PNG, JPG, WEBP � up to ${MAX_IMAGE_FILES} images`}
                label="PHOTOS"
                onPhotosChange={setPhotos}
                photos={photos}
                required
              />
              <Field
                error={submitAttempted && !isFutureDateTime(form.eventDateTime)}
                icon="🕒"
                label="Date & Time"
                onChange={(value) => setFormField('eventDateTime', value)}
                placeholder="mm/dd/yyyy --:-- --"
                type="datetime-local"
                value={form.eventDateTime}
              />
              {submitAttempted && !isFutureDateTime(form.eventDateTime) ? (
                <div className="notice notice--warn">Date must be in the future.</div>
              ) : null}
              <div className="section-label">Venue Location *</div>
              <div className="three-col">
                <Field
                  error={submitAttempted && !filled(form.venueArea)}
                  icon="📍"
                  label="Area"
                  onChange={(value) => setFormField('venueArea', value)}
                  placeholder="Area"
                  value={form.venueArea}
                />
                <Field
                  error={submitAttempted && !filled(form.venueCity)}
                  label="City"
                  onChange={(value) => setFormField('venueCity', value)}
                  placeholder="City"
                  value={form.venueCity}
                />
                <Field
                  error={submitAttempted && !filled(form.venueState)}
                  label="State"
                  onChange={(value) => setFormField('venueState', value)}
                  placeholder="State"
                  value={form.venueState}
                />
              </div>
              <Field label="Age Restriction" optional placeholder="e.g. 18 (leave blank if none)" icon="ℹ" />
            </div>
          </section>

          <PricingCard
            isNegotiable={isNegotiable}
            negotiableError={submitAttempted && isNegotiable === null}
            onNegotiableChange={setIsNegotiable}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            price={price}
            priceError={submitAttempted && !positivePrice(price)}
            priceLabel="Price per Pass (₹)"
            quantity={quantity}
            quantityError={submitAttempted && !positiveQuantity(quantity)}
            quantityLabel="Quantity"
            totalLabel={`Total for ${quantity || '0'} passes (₹)`}
            totalValue={pricingTotal}
          />
        </>
      )
    }

    if (productType === 'ticket') {
      return (
        <>
          <section className="wizard-card">
            <h2 className="wizard-card__title">TICKET TYPE</h2>
            <div className="choice-grid choice-grid--three">
              {(['Bus', 'Train', 'Plane'] as TicketType[]).map((type) => (
                <button
                  key={type}
                  className={`choice-tile choice-tile--stack choice-tile--compact ${ticketType === type ? 'choice-tile--selected' : ''}`}
                  onClick={() => setTicketType(type)}
                  type="button"
                >
                  <span className="choice-tile__icon">{type === 'Bus' ? '🚌' : type === 'Train' ? '🚆' : '✈️'}</span>
                  <span className="choice-tile__body choice-tile__body--centered">
                    <strong>{type}</strong>
                  </span>
                  {ticketType === type ? <span className="choice-tile__check">✓</span> : null}
                </button>
              ))}
            </div>
          </section>

          <section className="wizard-card">
            <h2 className="wizard-card__title">JOURNEY DETAILS</h2>
            <div className="stack">
              <div className="section-label">Origin *</div>
              <div className="three-col">
                <Field
                  error={submitAttempted && !filled(form.originArea)}
                  icon="📍"
                  label="Area"
                  onChange={(value) => setFormField('originArea', value)}
                  placeholder="Area"
                  value={form.originArea}
                />
                <Field
                  error={submitAttempted && !filled(form.originCity)}
                  label="City"
                  onChange={(value) => setFormField('originCity', value)}
                  placeholder="City"
                  value={form.originCity}
                />
                <Field
                  error={submitAttempted && !filled(form.originState)}
                  label="State"
                  onChange={(value) => setFormField('originState', value)}
                  placeholder="State"
                  value={form.originState}
                />
              </div>
              <div className="section-label">Destination *</div>
              <div className="three-col">
                <Field
                  error={submitAttempted && !filled(form.destArea)}
                  icon="📍"
                  label="Area"
                  onChange={(value) => setFormField('destArea', value)}
                  placeholder="Area"
                  value={form.destArea}
                />
                <Field
                  error={submitAttempted && !filled(form.destCity)}
                  label="City"
                  onChange={(value) => setFormField('destCity', value)}
                  placeholder="City"
                  value={form.destCity}
                />
                <Field
                  error={submitAttempted && !filled(form.destState)}
                  label="State"
                  onChange={(value) => setFormField('destState', value)}
                  placeholder="State"
                  value={form.destState}
                />
              </div>
              <div className="two-col">
                <Field
                  error={submitAttempted && (!filled(form.departureTime) || !isFutureDateTime(form.departureTime))}
                  icon="🕒"
                  label="Departure Time"
                  onChange={(value) => setFormField('departureTime', value)}
                  placeholder="mm/dd/yyyy --:-- --"
                  type="datetime-local"
                  value={form.departureTime}
                />
                <Field
                  error={submitAttempted && filled(form.departureTime) && filled(form.arrivalTime) && !isArrivalAfterDeparture(form.departureTime, form.arrivalTime)}
                  icon="🕒"
                  label="Arrival Time"
                  onChange={(value) => setFormField('arrivalTime', value)}
                  placeholder="mm/dd/yyyy --:-- --"
                  type="datetime-local"
                  value={form.arrivalTime}
                />
              </div>
              {submitAttempted && filled(form.departureTime) && !isFutureDateTime(form.departureTime) ? (
                <div className="notice notice--warn">Departure time must be in the future.</div>
              ) : null}
              {submitAttempted && filled(form.departureTime) && filled(form.arrivalTime) && !isArrivalAfterDeparture(form.departureTime, form.arrivalTime) ? (
                <div className="notice notice--warn">Arrival time must be after departure time.</div>
              ) : null}
              <TextAreaField
                label="Description"
                onChange={(value) => setFormField('description', value)}
                placeholder="Seat class, booking reference, special notes..."
                value={form.description}
              />
            </div>
          </section>

          <PricingCard
            isNegotiable={isNegotiable}
            negotiableError={submitAttempted && isNegotiable === null}
            onNegotiableChange={setIsNegotiable}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            price={price}
            priceError={submitAttempted && !positivePrice(price)}
            priceLabel="Price per Ticket (₹)"
            quantity={quantity}
            quantityError={submitAttempted && !positiveQuantity(quantity)}
            quantityLabel="Quantity"
            totalLabel={`Total for ${quantity || '0'} tickets (₹)`}
            totalValue={pricingTotal}
          />
        </>
      )
    }

    return (
      <>
        <section className="wizard-card">
          <h2 className="wizard-card__title">PRODUCT DETAILS</h2>
          <div className="stack">
            <Field
              error={submitAttempted && !filled(form.name)}
              icon="📦"
              label="Product Name"
              onChange={(value) => setFormField('name', value)}
              placeholder="e.g. iPhone 14 Pro Max 256GB"
              value={form.name}
            />
            <SelectFieldOther
              error={submitAttempted && !filled(form.category)}
              label="Category"
              onChange={(value) => setFormField('category', value)}
              placeholder="Select category"
              value={form.category}
            />
            <TextAreaField
              label="Description"
              onChange={(value) => setFormField('description', value)}
              placeholder="Condition, specs, reason for selling..."
              value={form.description}
              maxLength={1000}
            />
            <Field
              icon="🔗"
              label="Product URL"
              optional
              placeholder="https://amazon.com/dp/..."
              onChange={(value) => setFormField('productUrl', value)}
              value={form.productUrl}
            />
          </div>
        </section>

        <PhotoDrop
          error={submitAttempted && photos.length === 0}
          helper={`PNG, JPG, WEBP � up to ${MAX_IMAGE_FILES} images`}
          label="PHOTOS"
          onPhotosChange={setPhotos}
          photos={photos}
          required
        />

        <section className="wizard-card">
          <h2 className="wizard-card__title">USAGE HISTORY</h2>
          <div className="notice notice--soft">How long have you been using this item?</div>
          <div className="three-col">
            <Field
              label="Years"
              onChange={(value) => setFormField('usageYears', value)}
              placeholder="0"
              inputMode="numeric"
              min="0"
              step="1"
              type="number"
              value={form.usageYears}
            />
            <Field
              label="Months"
              onChange={(value) => setFormField('usageMonths', value)}
              placeholder="0"
              inputMode="numeric"
              min="0"
              step="1"
              type="number"
              value={form.usageMonths}
            />
            <Field
              label="Days"
              onChange={(value) => setFormField('usageDays', value)}
              placeholder="0"
              inputMode="numeric"
              min="0"
              step="1"
              type="number"
              value={form.usageDays}
            />
          </div>
        </section>

        <section className="wizard-card">
          <h2 className="wizard-card__title">WARRANTY</h2>
          <div className="field">
            <span className="field__label">Has Warranty? *</span>
            <div className={`option-row ${submitAttempted && hasWarranty === null ? 'option-row--error' : ''}`}>
              <ToggleButton active={hasWarranty === true} onClick={() => setHasWarranty(true)}>Yes</ToggleButton>
              <ToggleButton active={hasWarranty === false} onClick={() => setHasWarranty(false)}>No</ToggleButton>
            </div>
          </div>
          {hasWarranty ? (
            <div className="two-col two-col--tight">
              <Field
                error={submitAttempted && !filled(form.warrantyDuration)}
                icon="🛡"
                label="Warranty Duration"
                onChange={(value) => setFormField('warrantyDuration', value)}
                placeholder="e.g. 6"
                value={form.warrantyDuration}
              />
              <SelectFieldWarranty
                error={submitAttempted && !filled(form.warrantyUnit)}
                label="Unit"
                onChange={(value) => setFormField('warrantyUnit', value)}
                placeholder="Select"
                value={form.warrantyUnit}
              />
            </div>
          ) : null}
        </section>

        <PricingCard
          isNegotiable={isNegotiable}
          negotiableError={submitAttempted && isNegotiable === null}
          onNegotiableChange={setIsNegotiable}
          onPriceChange={setPrice}
          onQuantityChange={setQuantity}
          originalPriceLabel="Original Purchase Price"
          originalPrice={originalPrice}
          onOriginalPriceChange={setOriginalPrice}
          price={price}
          priceError={submitAttempted && !positivePrice(price)}
          priceLabel="Selling Price (₹)"
          quantity={quantity}
          quantityError={submitAttempted && !positiveQuantity(quantity)}
          quantityLabel="Quantity"
          showDiscountNotice
        />
      </>
    )
  }

  const continueDisabled = step === 1
    ? !canContinueStep1
    : step === 2
      ? listingType === 'found' ? false : !canContinueStep2
      : !isFinalStepValid

  const showValidationNotice = submitAttempted && isFinalStep && !isFinalStepValid

  return (
    <div className="add-item-page">
      <div className="add-item-page__inner">
        <button
          className="add-item-page__brand"
          type="button"
          onClick={() => navigate('/home')}
          aria-label="Findit home"
        >
          Findit
        </button>

        <div className="add-item-page__header">
          <div>
            <h1>Add New Listing</h1>
            <p>Fill in the details to publish your listing</p>
          </div>
          <button className="back-link" onClick={handleBack} type="button">
            {step === 1 ? '← Back to Home' : '← Back'}
          </button>
        </div>

        <div className="wizard-stepper" aria-label="Add item progress">
          {wizardSteps.map((label, index) => {
            const state = getStepState(index)

            return (
              <div className={`wizard-stepper__item is-${state}`} key={label}>
                <span className="wizard-stepper__badge">
                  {state === 'complete' ? '✓' : index + 1}
                </span>
                <span>{label}</span>
                {index < wizardSteps.length - 1 ? <span className="wizard-stepper__line" /> : null}
              </div>
            )
          })}
        </div>

        {step === 1 ? renderStepOne() : null}
        {step === 2 ? renderStepTwo() : null}
        {step === 3 ? renderStepThree() : null}

        {step > 1 ? (
          <div className="wizard-actions">
            {showValidationNotice ? (
              <p className="wizard-validation-notice">Please fill in all required fields (*) before publishing.</p>
            ) : null}
            <button className="secondary-button" onClick={handleBack} type="button">
              ← Back
            </button>
            <button
              className="primary-button"
              onClick={handleContinue}
              type="button"
              disabled={isSubmitting || (!isFinalStep && continueDisabled)}
            >
              {isFinalStep ? (isSubmitting ? 'Publishing...' : `✓ ${submitLabel}`) : 'Continue →'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ChoiceRow({
  active,
  description,
  icon,
  label,
  onSelect,
}: {
  active: boolean
  description: string
  icon: string
  label: string
  onSelect: () => void
}) {
  return (
    <button
      className={`choice-row ${active ? 'choice-row--selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <span className="choice-row__icon">{icon}</span>
      <span className="choice-row__body">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      {active ? <span className="choice-row__check">✓</span> : null}
    </button>
  )
}

function Field({
  label,
  placeholder,
  icon,
  optional,
  type = 'text',
  inputMode,
  min,
  step,
  value = '',
  onChange,
  error,
}: {
  label: string
  placeholder: string
  icon?: string
  optional?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  min?: string
  step?: string
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}{optional ? '' : ' *'}
      </span>
      <span className={`field__shell ${error ? 'field__shell--error' : ''}`}>
        {icon ? <span className="field__icon">{icon}</span> : null}
        <input
          placeholder={placeholder}
          inputMode={inputMode}
          min={min}
          step={step}
          type={type}
          {...(onChange
            ? {
                value,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
              }
            : { defaultValue: value })}
        />
      </span>
      {error ? <span className="field__error">This field is required</span> : null}
    </label>
  )
}

function SelectFieldFound({
  label,
  placeholder,
  value = '',
  onChange,
  error,
}: {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">{label} *</span>
      <span className={`field__shell field__shell--select ${error ? 'field__shell--error' : ''}`}>
        <span className="field__icon">🏷️</span>
        <select
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
        >
          <option value="" disabled>{placeholder}</option>
          <option value="Electronics">Electronics</option>
          <option value="Wearables">Wearables</option>
          <option value="Accessories">Accessories</option>
          <option value="Books & Documents">Books & Documents</option>
          <option value="Grooming">Grooming</option>
          <option value="Money">Money</option>
          <option value="ID Cards">ID Cards</option>
          <option value="Stationary">Stationary</option>
          <option value="Sports & Fitness">Sports & Fitness</option>
          <option value="Keys">Keys</option>
          <option value="Other">Other</option>
        </select>
        <span className="field__chevron">▾</span>
      </span>
      {error ? <span className="field__error">This field is required</span> : null}
    </label>
  )
}

function SelectFieldPass({
  label,
  placeholder,
  value = '',
  onChange,
  error,
}: {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">{label} *</span>
      <span className={`field__shell field__shell--select ${error ? 'field__shell--error' : ''}`}>
        <span className="field__icon">🏷️</span>
        <select
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
        >
          <option value="" disabled>{placeholder}</option>
          <option value="Concert">Concert</option>
          <option value="Movie">Movie</option>
          <option value="Event">Event</option>
          <option value="Other">Other</option>
        </select>
        <span className="field__chevron">▾</span>
      </span>
      {error ? <span className="field__error">This field is required</span> : null}
    </label>
  )
}

function SelectFieldOther({
  label,
  placeholder,
  value = '',
  onChange,
  error,
}: {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">{label} *</span>
      <span className={`field__shell field__shell--select ${error ? 'field__shell--error' : ''}`}>
        <span className="field__icon">🏷️</span>
        <select
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
        >
          <option value="" disabled>{placeholder}</option>
          <option value="Electronics">Electronics</option>
          <option value="Wearables">Wearables</option>
          <option value="Accessories">Accessories</option>
          <option value="Books & Documents">Books & Documents</option>
          <option value="Grooming">Grooming</option>
          <option value="Money">Money</option>
          <option value="ID Cards">ID Cards</option>
          <option value="Stationary">Stationary</option>
          <option value="Sports & Fitness">Sports & Fitness</option>
          <option value="Keys">Keys</option>
          <option value="Other">Other</option>
        </select>
        <span className="field__chevron">▾</span>
      </span>
      {error ? <span className="field__error">This field is required</span> : null}
    </label>
  )
}

function SelectFieldWarranty({
  label,
  placeholder,
  value = '',
  onChange,
  error,
}: {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">{label} *</span>
      <span className={`field__shell field__shell--select ${error ? 'field__shell--error' : ''}`}>
        <span className="field__icon">🏷️</span>
        <select
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
        >
          <option value="" disabled>{placeholder}</option>
          <option value="days">Days</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
        <span className="field__chevron">▾</span>
      </span>
      {error ? <span className="field__error">This field is required</span> : null}
    </label>
  )
}



function TextAreaField({
  label,
  placeholder,
  value = '',
  onChange,
  maxLength,
}: {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  maxLength?: number
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__shell field__shell--textarea">
        <textarea
          maxLength={maxLength}
          placeholder={placeholder}
          {...(onChange
            ? {
                value,
                onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
              }
            : { defaultValue: value })}
        />
      </span>
      {maxLength ? <span className="field__counter">0 / {maxLength}</span> : null}
    </label>
  )
}

function PhotoDrop({
  label,
  helper,
  photos,
  onPhotosChange,
  required,
  error,
}: {
  label: string
  helper: string
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  required?: boolean
  error?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const photosRef = useRef(photos)

  photosRef.current = photos

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview))
    }
  }, [])

  function addFiles(fileList: FileList | null) {
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

    onPhotosChange([...photos, ...nextPhotos])
  }

  function openPicker() {
    if (photos.length >= MAX_IMAGE_FILES) return
    inputRef.current?.click()
  }

  function removePhoto(id: string) {
    const removed = photos.find((photo) => photo.id === id)
    if (removed) URL.revokeObjectURL(removed.preview)
    onPhotosChange(photos.filter((photo) => photo.id !== id))
  }

  return (
    <section className={`wizard-card section-card--photos ${error ? 'section-card--photos-error' : ''}`}>
      <div className="section-card__title">{label}{required ? ' *' : ''}</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <div className="photo-stack">
        <div className="photo-previews">
          {photos.map((photo) => (
            <div className="photo-preview" key={photo.id}>
              <img alt="" src={photo.preview} />
              <button
                aria-label="Remove photo"
                className="photo-preview__remove"
                onClick={(event) => {
                  event.stopPropagation()
                  removePhoto(photo.id)
                }}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_IMAGE_FILES ? (
            <button className="photo-thumb" onClick={openPicker} type="button">
              Add
            </button>
          ) : null}
        </div>
        <button
          className={`photo-drop ${dragOver ? 'photo-drop--active' : ''}`}
          onClick={openPicker}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            addFiles(event.dataTransfer.files)
          }}
          type="button"
        >
          <div className="photo-drop__icon">⤴</div>
          <strong>Drop photos here or click to browse</strong>
          <span>{helper}</span>
          <span>{photos.length} / {MAX_IMAGE_FILES} selected</span>
        </button>
      </div>
      {error ? <span className="field__error">At least one photo is required</span> : null}
      {label === 'PHOTO' ? (
        <div className="notice notice--warn notice--inline">
          A clear photo helps the owner recognize their item. Avoid showing personal info visible on documents.
        </div>
      ) : null}
    </section>
  )
}

function PricingCard({
  priceLabel,
  originalPriceLabel,
  originalPrice,
  onOriginalPriceChange,
  quantityLabel,
  isNegotiable,
  onNegotiableChange,
  price,
  quantity,
  onPriceChange,
  onQuantityChange,
  totalLabel,
  totalValue,
  showDiscountNotice,
  priceError,
  quantityError,
  negotiableError,
}: {
  priceLabel: string
  originalPriceLabel?: string
  originalPrice?: string
  onOriginalPriceChange?: (value: string) => void
  quantityLabel: string
  isNegotiable: boolean | null
  onNegotiableChange: (value: boolean) => void
  price: string
  quantity: string
  onPriceChange: (value: string) => void
  onQuantityChange: (value: string) => void
  totalLabel?: string
  totalValue?: number
  showDiscountNotice?: boolean
  priceError?: boolean
  quantityError?: boolean
  negotiableError?: boolean
}) {

  const current = Number(price)
  const original = Number(originalPrice)
  const discount = original > 0 && current >= 0
  ? Math.round(((original - current)/ original )*100) : null
  return (
    <section className="wizard-card">
      <h2 className="wizard-card__title">PRICING & QUANTITY</h2>
      <div className="stack">
        <div className="two-col two-col--tight">
          <Field
            error={priceError}
            icon="₹"
            inputMode="decimal"
            label={priceLabel}
            onChange={onPriceChange}
            placeholder="₹ 0.00"
            min="0"
            step="0.01"
            type="number"
            value={price}
          />
          {originalPriceLabel ? (
            <Field
              icon="₹"
              inputMode="decimal"
              label={originalPriceLabel}
              optional
              onChange={onOriginalPriceChange}
              placeholder="₹ 0.00"
              min="0"
              step="0.01"
              type="number"
              value={originalPrice}
            />
          ) : null}
          <Field
            error={quantityError}
            icon="▣"
            inputMode="numeric"
            label={quantityLabel}
            onChange={(value) => {
              const digitsOnly = value.replace(/\D+/g, '')
              onQuantityChange(digitsOnly)
            }}
            placeholder="1"
            min="1"
            step="1"
            type="number"
            value={quantity}
          />
          <div className="field">
            <span className="field__label">Negotiable? *</span>
            <div className={`option-row option-row--compact ${negotiableError ? 'option-row--error' : ''}`}>
              <ToggleButton active={isNegotiable === true} onClick={() => onNegotiableChange(true)}>Yes</ToggleButton>
              <ToggleButton active={isNegotiable === false} onClick={() => onNegotiableChange(false)}>No</ToggleButton>
            </div>
            {negotiableError ? <span className="field__error">Please select an option</span> : null}
          </div>
        </div>
        {showDiscountNotice && discount != null ? (
          <div className="notice notice--soft">
            {discount>0
            ? `Selling at ${discount}% discount from original price.`
            : discount === 0
            ? 'Selling at the original price.'
            : `Selling at ${Math.abs(discount)}% above the original price.`
            }
          </div>
        ) : null}
        {totalLabel && totalValue !== undefined ? (
          <div className="pricing-total">
            <span className="pricing-total__icon">₹</span>
            <span>
              {totalLabel}: <strong>₹{totalValue.toFixed(2)}</strong>
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button className={`toggle-button ${active ? 'is-active' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  )
}
