import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import '../../styles/variables.css'
import './AddItem.css'

type ListingType = 'product' | 'found'
type ProductType = 'pass' | 'ticket' | 'other'
type TicketType = 'Bus' | 'Train' | 'Plane'
type Photo = { id: string; file: File; preview: string }

type WizardForm = {
  name: string
  category: string
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
  warrantyDuration: string
  warrantyUnit: string
}

const emptyForm: WizardForm = {
  name: '',
  category: '',
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

  function setFormField<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
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
      setSubmitAttempted(true)
      if (!isFinalStepValid) return
      navigate('/home')
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
                placeholder="Describe the item — color, brand, markings, condition when found..."
              />
            </div>
          </section>

          <PhotoDrop
            error={submitAttempted && photos.length === 0}
            helper="PNG, JPG, WEBP · up to 8 images"
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
              <TextAreaField label="Description" placeholder="Describe the pass — seat details, perks, restrictions..." />
              <PhotoDrop
                error={submitAttempted && photos.length === 0}
                helper="PNG, JPG, WEBP · up to 8 images"
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
            priceLabel="Price per Pass"
            quantity={quantity}
            quantityError={submitAttempted && !positiveQuantity(quantity)}
            quantityLabel="Quantity"
            totalLabel={`Total for ${quantity || '0'} passes`}
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
                  error={submitAttempted && !filled(form.departureTime)}
                  icon="🕒"
                  label="Departure Time"
                  onChange={(value) => setFormField('departureTime', value)}
                  placeholder="mm/dd/yyyy --:-- --"
                  type="datetime-local"
                  value={form.departureTime}
                />
                <Field
                  error={submitAttempted && !filled(form.arrivalTime)}
                  icon="🕒"
                  label="Arrival Time"
                  onChange={(value) => setFormField('arrivalTime', value)}
                  placeholder="mm/dd/yyyy --:-- --"
                  type="datetime-local"
                  value={form.arrivalTime}
                />
              </div>
              <TextAreaField label="Description" placeholder="Seat class, booking reference, special notes..." />
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
            priceLabel="Price per Ticket"
            quantity={quantity}
            quantityError={submitAttempted && !positiveQuantity(quantity)}
            quantityLabel="Quantity"
            totalLabel={`Total for ${quantity || '0'} tickets`}
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
            <TextAreaField label="Description" placeholder="Condition, specs, reason for selling..." maxLength={1000} />
            <Field label="Product URL" optional placeholder="https://amazon.com/dp/..." icon="🔗" />
          </div>
        </section>

        <PhotoDrop
          error={submitAttempted && photos.length === 0}
          helper="PNG, JPG, WEBP · up to 8 images"
          label="PHOTOS"
          onPhotosChange={setPhotos}
          photos={photos}
          required
        />

        <section className="wizard-card">
          <h2 className="wizard-card__title">USAGE HISTORY</h2>
          <div className="notice notice--soft">How long have you been using this item?</div>
          <div className="three-col">
            <Field label="Years" placeholder="0" />
            <Field label="Months" placeholder="0" />
            <Field label="Days" placeholder="0" />
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
          priceLabel="Selling Price"
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
              disabled={!isFinalStep && continueDisabled}
            >
              {isFinalStep ? `✓ ${submitLabel}` : 'Continue →'}
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
  value = '',
  onChange,
  error,
}: {
  label: string
  placeholder: string
  icon?: string
  optional?: boolean
  type?: string
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
          type={type}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
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
          <option value="general">Electronics</option>
          <option value="electronics">Wearables</option>
          <option value="fashion">Accessories</option>
          <option value="fashion">Books & Documents</option>
          <option value="fashion">Grooming</option>
          <option value="fashion">Money</option>
          <option value="fashion">ID Cards</option>
          <option value="fashion">Sports & Fitness</option>
          <option value="fashion">Keys</option>
          <option value="fashion">Other</option>
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
          <option value="general">Concert</option>
          <option value="electronics">Movie</option>
          <option value="fashion">Event</option>
          <option value="fashion">Other</option>
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
          <option value="general">Electronics</option>
          <option value="electronics">Wearables</option>
          <option value="fashion">Grooming</option>
          <option value="fashion">Stationery</option>
          <option value="fashion">Books</option>
          <option value="fashion">Hostel Essentials</option>
          <option value="fashion">Sports & Fitness</option>
          <option value="fashion">Other</option>
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
          <option value="general">Days</option>
          <option value="electronics">Months</option>
          <option value="fashion">Years</option>
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
  maxLength,
}: {
  label: string
  placeholder: string
  maxLength?: number
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__shell field__shell--textarea">
        <textarea placeholder={placeholder} maxLength={maxLength} />
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

    const remaining = 8 - photos.length
    if (remaining <= 0) return

    const accepted = Array.from(fileList).filter((file) =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type),
    )

    const nextPhotos = accepted.slice(0, remaining).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
    }))

    onPhotosChange([...photos, ...nextPhotos])
  }

  function openPicker() {
    if (photos.length >= 8) return
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
          {photos.length < 8 ? (
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
            icon="$"
            label={priceLabel}
            onChange={onPriceChange}
            placeholder="$ 0.00"
            value={price}
          />
          {originalPriceLabel ? (
            <Field icon="$" label={originalPriceLabel} optional placeholder="$ 0.00" value={originalPrice} onChange={onOriginalPriceChange}/>
          ) : null}
          <Field
            error={quantityError}
            icon="▣"
            label={quantityLabel}
            onChange={onQuantityChange}
            placeholder="1"
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
            <span className="pricing-total__icon">$</span>
            <span>
              {totalLabel}: <strong>${totalValue.toFixed(2)}</strong>
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
