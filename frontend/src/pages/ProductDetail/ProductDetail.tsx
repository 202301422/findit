import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/utils/api'
import ImageGallery from '@/components/product/ImageGallery'
import SellerCard from '@/components/product/SellerCard'
import QuickChatModal from '@/components/product/QuickChatModal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { 
  ArrowLeft, Calendar, MapPin, Info, Trash2, Edit2, 
  CheckCircle, Plus, X, ExternalLink
} from 'lucide-react'

/* ============================================================
   Types
   ============================================================ */
interface ProductImage { url: string; publicId: string }
interface Seller {
  _id: string; name: string; email: string
  avatar?: string; createdAt?: string; phone?: string; college?: string
}
interface UsageTime { years: number; months: number; days: number }
interface Location { area: string; city: string; state: string }

interface SellProduct {
  _id: string; name: string; category: string; description?: string
  sellingPrice: number; purchasePrice?: number; productURL?: string
  quantity: number; isNegotiable: boolean; hasWarranty: boolean
  warrantyValue?: number; warrantyUnit?: string; usageTime?: UsageTime
  images: ProductImage[]; status: string; user: Seller
  createdAt: string; updatedAt: string
}

interface FoundItem {
  _id: string; name: string; category: string; description?: string
  venue: string; dateTime: string
  images: ProductImage[]; status: string; user: Seller; createdAt: string
}

interface EventPass {
  _id: string; name: string; category: 'Concert' | 'Movie' | 'Event' | 'Other'
  images: ProductImage[]; imageUrl: string; description?: string
  price: number; dateTime: string
  venue: Location; quantity: number; isNegotiable: boolean
  ageRestriction?: number; status: string; user: Seller; createdAt: string
}

interface TravelTicket {
  _id: string; ticketType: 'Bus' | 'Train' | 'Plane'
  origin: Location; destination: Location
  departureTime: string; arrivalTime: string
  isNegotiable: boolean; price: number; quantity: number
  description?: string; status?: string; user: Seller; createdAt: string
}

/* ============================================================
   Constants
   ============================================================ */
const SELL_CATEGORIES = [
  'Electronics','Clothing & Accessories','Books & Documents','Furniture & Home',
  'Sports & Fitness','Vehicles & Parts','Musical Instruments','Gaming','Art & Collectibles','Other',
]
const PASS_CATEGORIES = ['Concert','Movie','Event','Other']
const FOUND_CATEGORIES = [
  'Electronics','Wearables','Accessories','Books & Documents','Grooming',
  'Money','ID Cards','Stationary','Sports & Fitness','Keys','Other',
]

/* ============================================================
   Helpers
   ============================================================ */
function formatUsageTime(u?: UsageTime): string {
  if (!u) return 'Not specified'
  const p: string[] = []
  if (u.years > 0) p.push(`${u.years}y`)
  if (u.months > 0) p.push(`${u.months}mo`)
  if (u.days > 0) p.push(`${u.days}d`)
  return p.length > 0 ? p.join(' ') : 'Brand new'
}


function discountPct(s: number, p?: number) {
  if (!p || p <= 0) return null
  const pct = Math.round(((p - s) / p) * 100)
  return pct > 0 ? pct : null
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })
    + ' at ' + new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
}

function formatLocation(loc: Location) {
  return [loc.area, loc.city, loc.state].filter(Boolean).join(', ')
}

function sameId(a?: string, b?: string) {
  if (!a || !b) return false
  return String(a).trim() === String(b).trim()
}

/* ============================================================
   Shared Image Upload Helper
   ============================================================ */
interface ImageUploaderProps {
  existing: ProductImage[]
  onExistingChange: (imgs: ProductImage[]) => void
  newFiles: File[]
  newPreviews: string[]
  onAdd: (files: File[]) => void
  onRemoveNew: (i: number) => void
  maxImages?: number
}

function ImageUploader({ existing, onExistingChange, newFiles, newPreviews, onAdd, onRemoveNew, maxImages = 5 }: ImageUploaderProps) {
  const total = existing.length + newFiles.length
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
        Listing Photos ({total}/{maxImages})
      </span>
      <div className="flex flex-wrap gap-2.5">
        {existing.map((img, i) => (
          <div key={img.publicId} className="relative w-20 h-16 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] group">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/75 text-white text-xs cursor-pointer hover:bg-black/90"
              onClick={() => onExistingChange(existing.filter((_, j) => j !== i))}
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {newPreviews.map((src, i) => (
          <div key={i} className="relative w-20 h-16 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/75 text-white text-xs cursor-pointer hover:bg-black/90"
              onClick={() => onRemoveNew(i)}
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {total < maxImages && (
          <label className="w-20 h-16 flex flex-col items-center justify-center border border-dashed border-[var(--border-primary)] rounded-[var(--radius-sm)] hover:border-[var(--color-primary-500)]/50 hover:bg-[var(--bg-secondary)] transition-all cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <Plus size={16} />
            <span className="text-[10px] font-medium mt-1">Upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files || [])
                onAdd(picked.slice(0, maxImages - total))
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}

function useImageEditor(maxImages = 5) {
  const [existing, setExisting] = useState<ProductImage[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  function initExisting(imgs: ProductImage[]) {
    setExisting(imgs)
    setNewFiles([])
    setNewPreviews([])
  }

  function addFiles(files: File[]) {
    const total = existing.length + newFiles.length
    const allowed = maxImages - total
    const toAdd = files.slice(0, allowed)
    setNewFiles((p) => [...p, ...toAdd])
    setNewPreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))])
  }

  function removeNew(i: number) {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles((p) => p.filter((_, j) => j !== i))
    setNewPreviews((p) => p.filter((_, j) => j !== i))
  }

  return { existing, setExisting, newFiles, newPreviews, initExisting, addFiles, removeNew }
}

/* ============================================================
   Edit Sub-panels
   ============================================================ */
function EditSellPanel({ product, onClose, onSaved }: {
  product: SellProduct; onClose: () => void; onSaved: (u: SellProduct) => void
}) {
  const imgEd = useImageEditor(5)
  const [name, setName] = useState(product.name)
  const [category, setCategory] = useState(product.category)
  const [description, setDescription] = useState(product.description || '')
  const [productUrl, setProductUrl] = useState(product.productURL || '')
  const [sellingPrice, setSellingPrice] = useState(String(product.sellingPrice))
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice ? String(product.purchasePrice) : '')
  const [quantity, setQuantity] = useState(String(product.quantity))
  const [usageYears, setUsageYears] = useState(String(product.usageTime?.years || 0))
  const [usageMonths, setUsageMonths] = useState(String(product.usageTime?.months || 0))
  const [usageDays, setUsageDays] = useState(String(product.usageTime?.days || 0))
  const [hasWarranty, setHasWarranty] = useState(product.hasWarranty)
  const [warrantyDuration, setWarrantyDuration] = useState(product.warrantyValue ? String(product.warrantyValue) : '')
  const [warrantyUnit, setWarrantyUnit] = useState(product.warrantyUnit || 'months')
  const [isNegotiable, setIsNegotiable] = useState(product.isNegotiable)
  const [saving, setSaving] = useState(false)

  useEffect(() => { imgEd.initExisting(product.images) }, [])

  async function save() {
    if (saving) return
    if (!name.trim()) { toast.error('Name required'); return }
    if (!sellingPrice || isNaN(Number(sellingPrice))) { toast.error('Valid price required'); return }
    if (!imgEd.existing.length && !imgEd.newFiles.length) { toast.error('At least one image required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('category', category)
      fd.append('description', description.trim())
      fd.append('productURL', productUrl.trim())
      fd.append('sellingPrice', sellingPrice)
      fd.append('purchasePrice', purchasePrice)
      fd.append('quantity', quantity)
      fd.append('isNegotiable', String(isNegotiable))
      fd.append('hasWarranty', String(hasWarranty))
      fd.append('usageTime', JSON.stringify({ years: usageYears || '0', months: usageMonths || '0', days: usageDays || '0' }))
      if (hasWarranty) {
        fd.append('warrantyValue', warrantyDuration)
        fd.append('warrantyUnit', warrantyUnit)
      }
      fd.append('keepImagePublicIds', JSON.stringify(imgEd.existing.map((i) => i.publicId)))
      if (imgEd.newFiles.length) {
        imgEd.newFiles.forEach((f) => fd.append('images', f))
      }
      const res = await api.put(`/sell-products/${product._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        toast.success('Updated!')
        onSaved(res.data.data)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Edit Listing" onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <ImageUploader
          existing={imgEd.existing}
          onExistingChange={imgEd.setExisting}
          newFiles={imgEd.newFiles}
          newPreviews={imgEd.newPreviews}
          onAdd={imgEd.addFiles}
          onRemoveNew={imgEd.removeNew}
        />
        <Input label="Product Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
            >
              {SELL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Quantity *" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Selling Price (₹) *" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
          <Input label="Original Price (₹)" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">Description</label>
          <textarea
            className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Input label="Product Web Link (optional)" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://..." />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">Is price negotiable?</label>
          <div className="flex gap-2">
            <Button size="sm" variant={isNegotiable ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(true)}>Yes</Button>
            <Button size="sm" variant={!isNegotiable ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(false)}>No</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Input label="Usage Years" type="number" value={usageYears} onChange={(e) => setUsageYears(e.target.value)} />
          <Input label="Usage Months" type="number" value={usageMonths} onChange={(e) => setUsageMonths(e.target.value)} />
          <Input label="Usage Days" type="number" value={usageDays} onChange={(e) => setUsageDays(e.target.value)} />
        </div>

        <div className="space-y-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Has Warranty?</span>
            <div className="flex gap-2">
              <Button size="sm" variant={hasWarranty ? 'primary' : 'secondary'} onClick={() => setHasWarranty(true)}>Yes</Button>
              <Button size="sm" variant={!hasWarranty ? 'primary' : 'secondary'} onClick={() => setHasWarranty(false)}>No</Button>
            </div>
          </div>
          {hasWarranty && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <Input label="Duration" type="number" value={warrantyDuration} onChange={(e) => setWarrantyDuration(e.target.value)} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Unit</label>
                <select
                  value={warrantyUnit}
                  onChange={(e) => setWarrantyUnit(e.target.value)}
                  className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}

function EditPassPanel({ pass, onClose, onSaved }: {
  pass: EventPass; onClose: () => void; onSaved: (u: EventPass) => void
}) {
  const imgEd = useImageEditor(5)
  const [name, setName] = useState(pass.name)
  const [category, setCategory] = useState(pass.category)
  const [description, setDescription] = useState(pass.description || '')
  const [price, setPrice] = useState(String(pass.price))
  const [quantity, setQuantity] = useState(String(pass.quantity))
  const [dateTime, setDateTime] = useState(pass.dateTime ? new Date(pass.dateTime).toISOString().slice(0, 16) : '')
  const [venueArea, setVenueArea] = useState(pass.venue.area)
  const [venueCity, setVenueCity] = useState(pass.venue.city)
  const [venueState, setVenueState] = useState(pass.venue.state)
  const [ageRestriction, setAgeRestriction] = useState(pass.ageRestriction ? String(pass.ageRestriction) : '')
  const [isNegotiable, setIsNegotiable] = useState(pass.isNegotiable)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const existing: ProductImage[] = pass.images && pass.images.length > 0
      ? pass.images
      : pass.imageUrl ? [{ url: pass.imageUrl, publicId: 'legacy' }] : []
    imgEd.initExisting(existing)
  }, [])

  async function save() {
    if (saving) return
    if (!name.trim()) { toast.error('Name required'); return }
    if (!price || isNaN(Number(price))) { toast.error('Valid price required'); return }
    if (!imgEd.existing.length && !imgEd.newFiles.length) { toast.error('At least one image required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('category', category)
      fd.append('description', description.trim())
      fd.append('price', price)
      fd.append('quantity', quantity)
      fd.append('dateTime', dateTime)
      fd.append('venue', JSON.stringify({ area: venueArea, city: venueCity, state: venueState }))
      fd.append('isNegotiable', String(isNegotiable))
      if (ageRestriction) fd.append('ageRestriction', ageRestriction)
      fd.append('keepImagePublicIds', JSON.stringify(imgEd.existing.map((i) => i.publicId)))
      if (imgEd.newFiles.length) {
        imgEd.newFiles.forEach((f) => fd.append('images', f))
      }
      const res = await api.put(`/passes/${pass._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        toast.success('Pass updated!')
        onSaved(res.data.data)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Edit Event Pass" onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <ImageUploader
          existing={imgEd.existing}
          onExistingChange={imgEd.setExisting}
          newFiles={imgEd.newFiles}
          newPreviews={imgEd.newPreviews}
          onAdd={imgEd.addFiles}
          onRemoveNew={imgEd.removeNew}
        />
        <Input label="Pass Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
            >
              {PASS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Quantity *" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (₹) *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Age Restriction" type="number" value={ageRestriction} onChange={(e) => setAgeRestriction(e.target.value)} placeholder="e.g. 18" />
        </div>
        <Input label="Event Date & Time" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
        <div className="space-y-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Venue Address</span>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Area" value={venueArea} onChange={(e) => setVenueArea(e.target.value)} />
            <Input placeholder="City" value={venueCity} onChange={(e) => setVenueCity(e.target.value)} />
            <Input placeholder="State" value={venueState} onChange={(e) => setVenueState(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Negotiable?</label>
          <div className="flex gap-2">
            <Button size="sm" variant={isNegotiable ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(true)}>Yes</Button>
            <Button size="sm" variant={!isNegotiable ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(false)}>No</Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}

function EditTicketPanel({ ticket, onClose, onSaved }: {
  ticket: TravelTicket; onClose: () => void; onSaved: (u: TravelTicket) => void
}) {
  const [ticketType, setTicketType] = useState(ticket.ticketType)
  const [description, setDescription] = useState(ticket.description || '')
  const [price, setPrice] = useState(String(ticket.price))
  const [quantity, setQuantity] = useState(String(ticket.quantity))
  const [departureTime, setDepartureTime] = useState(ticket.departureTime ? new Date(ticket.departureTime).toISOString().slice(0, 16) : '')
  const [arrivalTime, setArrivalTime] = useState(ticket.arrivalTime ? new Date(ticket.arrivalTime).toISOString().slice(0, 16) : '')
  const [originArea, setOriginArea] = useState(ticket.origin.area)
  const [originCity, setOriginCity] = useState(ticket.origin.city)
  const [originState, setOriginState] = useState(ticket.origin.state)
  const [destArea, setDestArea] = useState(ticket.destination.area)
  const [destCity, setDestCity] = useState(ticket.destination.city)
  const [destState, setDestState] = useState(ticket.destination.state)
  const [isNegotiable, setIsNegotiable] = useState(ticket.isNegotiable)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (saving) return
    if (!price || isNaN(Number(price))) { toast.error('Valid price required'); return }
    setSaving(true)
    try {
      const res = await api.put(`/tickets/${ticket._id}`, {
        ticketType,
        description: description.trim(),
        price,
        quantity,
        isNegotiable: String(isNegotiable),
        departureTime,
        arrivalTime,
        origin: JSON.stringify({ area: originArea, city: originCity, state: originState }),
        destination: JSON.stringify({ area: destArea, city: destCity, state: destState }),
      })
      if (res.data.success) {
        toast.success('Ticket updated!')
        onSaved(res.data.data)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Edit Ticket" onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ticket Type *</label>
          <select
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value as any)}
            className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
          >
            <option value="Bus">Bus</option>
            <option value="Train">Train</option>
            <option value="Plane">Plane</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (₹) *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Seats/Qty *" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Departure" type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
          <Input label="Arrival" type="datetime-local" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
        </div>

        <div className="space-y-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Origin boarding location</span>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Area" value={originArea} onChange={(e) => setOriginArea(e.target.value)} />
            <Input placeholder="City" value={originCity} onChange={(e) => setOriginCity(e.target.value)} />
            <Input placeholder="State" value={originState} onChange={(e) => setOriginState(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Destination boarding location</span>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Area" value={destArea} onChange={(e) => setDestArea(e.target.value)} />
            <Input placeholder="City" value={destCity} onChange={(e) => setDestCity(e.target.value)} />
            <Input placeholder="State" value={destState} onChange={(e) => setDestState(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Negotiable?</label>
          <div className="flex gap-2">
            <Button size="sm" variant={isNegotiable ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(true)}>Yes</Button>
            <Button size="sm" variant={!isNegotiable ? 'primary' : 'secondary'} onClick={() => setIsNegotiable(false)}>No</Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}

function EditFoundPanel({ item, onClose, onSaved }: {
  item: FoundItem; onClose: () => void; onSaved: (u: FoundItem) => void
}) {
  const imgEd = useImageEditor(5)
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [description, setDescription] = useState(item.description || '')
  const [venue, setVenue] = useState(item.venue)
  const [dateTime, setDateTime] = useState(item.dateTime ? new Date(item.dateTime).toISOString().slice(0, 16) : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { imgEd.initExisting(item.images) }, [])

  async function save() {
    if (saving) return
    if (!name.trim()) { toast.error('Name required'); return }
    if (!imgEd.existing.length && !imgEd.newFiles.length) { toast.error('At least one image required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('category', category)
      fd.append('description', description.trim())
      fd.append('venue', venue.trim())
      fd.append('dateTime', dateTime)
      fd.append('keepImagePublicIds', JSON.stringify(imgEd.existing.map((i) => i.publicId)))
      if (imgEd.newFiles.length) {
        imgEd.newFiles.forEach((f) => fd.append('images', f))
      }
      const res = await api.put(`/found-products/${item._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        toast.success('Updated!')
        onSaved(res.data.data)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Edit Found Item" onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <ImageUploader
          existing={imgEd.existing}
          onExistingChange={imgEd.setExisting}
          newFiles={imgEd.newFiles}
          newPreviews={imgEd.newPreviews}
          onAdd={imgEd.addFiles}
          onRemoveNew={imgEd.removeNew}
        />
        <Input label="Item Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
          >
            {FOUND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Found Location *" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. library study desk" />
        <Input label="Date & Time Found" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}

/* ============================================================
   Manage Action Modals
   ============================================================ */
function ActionConfirmModal({
  open,
  title,
  desc,
  icon,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
  loading
}: {
  open: boolean; title: string; desc: string; icon: string; confirmLabel: string;
  danger?: boolean; onCancel: () => void; onConfirm: () => void; loading: boolean
}) {
  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <div className="flex flex-col items-center text-center p-4 space-y-4">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
        <div className="flex justify-end gap-3 w-full pt-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ============================================================
   Type-specific detail layout renderers
   ============================================================ */

/* ---- Sell Product ----------------------------------------- */
function SellProductDetail({ product, setProduct, isOwner, onChat }: {
  product: SellProduct; setProduct: (p: SellProduct) => void; isOwner: boolean; onChat: () => void
}) {
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showSold, setShowSold] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/sell-products/${product._id}`)
      toast.success('Deleted')
      navigate('/home')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  async function handleSold() {
    setMarking(true)
    try {
      const res = await api.put(`/sell-products/${product._id}`, { status: 'sold' })
      if (res.data.success) {
        setProduct({ ...product, ...res.data.data, user: typeof res.data.data.user === 'object' && res.data.data.user ? res.data.data.user : product.user })
        toast.success('Marked as sold!')
      }
    } catch {
      toast.error('Failed')
    } finally {
      setMarking(false)
      setShowSold(false)
    }
  }

  const isSold = product.status === 'sold'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <ImageGallery images={product.images} isSold={isSold} />
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{product.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="primary">{product.category}</Badge>
              {product.isNegotiable && <Badge variant="success">Negotiable</Badge>}
              {product.hasWarranty && <Badge variant="info">Warranty</Badge>}
            </div>
          </div>
          {product.description && (
            <div className="pt-2 border-t border-[var(--border-secondary)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Description</span>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[var(--color-primary-500)]">₹{product.sellingPrice.toLocaleString()}</span>
            {product.purchasePrice && product.purchasePrice > product.sellingPrice && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-[var(--text-tertiary)] line-through">₹{product.purchasePrice.toLocaleString()}</span>
                {discountPct(product.sellingPrice, product.purchasePrice) !== null && (
                  <span className="text-xs font-bold text-[var(--color-success-600)]">{discountPct(product.sellingPrice, product.purchasePrice)}% off</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-secondary)]">
            <div className="p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] block">Condition / Used</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-1">{formatUsageTime(product.usageTime)}</span>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] block">Quantity Left</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-1">{product.quantity} units</span>
            </div>
          </div>

          {product.productURL && product.productURL.trim() !== '' && (
            <a
              href={product.productURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-[var(--radius-md)] border border-[var(--border-primary)] text-xs font-semibold hover:bg-[var(--bg-secondary)] transition-all cursor-pointer text-[var(--text-primary)]"
            >
              <ExternalLink size={14} />
              View Original Web Page
            </a>
          )}
        </div>

        {isOwner && (
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-4 shadow-[var(--shadow-card)] space-y-3">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Manage Listing</span>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="secondary" iconLeft={<Edit2 size={13} />} onClick={() => setShowEdit(true)}>Edit</Button>
              {!isSold && <Button size="sm" variant="outline" iconLeft={<CheckCircle size={13} />} onClick={() => setShowSold(true)}>Mark Sold</Button>}
              <Button size="sm" variant="danger" iconLeft={<Trash2 size={13} />} onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
          </div>
        )}

        <SellerCard seller={product.user} createdAt={product.createdAt} isOwner={isOwner} isSold={isSold} onChat={onChat} />
      </div>

      {showEdit && <EditSellPanel product={product} onClose={() => setShowEdit(false)} onSaved={(u) => { setProduct(u); setShowEdit(false) }} />}
      <ActionConfirmModal
        open={showDelete}
        title="Delete Listing?"
        desc="Are you sure you want to permanently delete this listing? This action cannot be undone."
        icon="🗑️"
        confirmLabel="Yes, Delete"
        danger
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
      <ActionConfirmModal
        open={showSold}
        title="Mark as Sold?"
        desc="Are you sure you want to mark this item as sold? Buyers will no longer be able to message you about it."
        icon="🏷️"
        confirmLabel="Yes, Mark Sold"
        onCancel={() => setShowSold(false)}
        onConfirm={handleSold}
        loading={marking}
      />
    </div>
  )
}

/* ---- Found Item ------------------------------------------- */
function FoundItemDetail({ item, setItem, isOwner, onChat }: {
  item: FoundItem; setItem: (p: FoundItem) => void; isOwner: boolean; onChat: () => void
}) {
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showClaimed, setShowClaimed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)

  const isClosed = item.status === 'sold' || item.status === 'closed'

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/found-products/${item._id}`)
      toast.success('Listing deleted')
      navigate('/home')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  async function handleClaimed() {
    setMarking(true)
    try {
      const fd2 = new FormData()
      fd2.append('status', 'sold')
      const res = await api.put(`/found-products/${item._id}`, fd2, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        setItem({ ...item, status: 'sold' })
        toast.success('Marked as returned!')
      }
    } catch {
      toast.error('Failed to update')
    } finally {
      setMarking(false)
      setShowClaimed(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <ImageGallery images={item.images} isSold={isClosed} soldLabel="Returned" />
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{item.name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="primary">{item.category}</Badge>
              <Badge variant={isClosed ? 'success' : 'warning'}>{isClosed ? 'Returned' : 'Pending Owner'}</Badge>
            </div>
          </div>
          {item.description && (
            <div className="pt-2 border-t border-[var(--border-secondary)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Description</span>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex gap-2.5 p-3 rounded-[var(--radius-md)] bg-[var(--color-info-50)] dark:bg-[var(--color-info-500)]/10 text-xs text-[var(--color-info-600)] dark:text-[var(--color-info-500)]">
            <Info size={16} className="shrink-0" />
            <p>This item was reported found. If this is your item, contact the finder below and prepare ownership validation details.</p>
          </div>
          <div className="pt-2 border-t border-[var(--border-secondary)] space-y-3">
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin size={16} className="text-[var(--text-tertiary)] mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Found Location</span>
                <p className="text-[var(--text-primary)] font-medium mt-0.5">{item.venue}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Calendar size={16} className="text-[var(--text-tertiary)] mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Reported Found On</span>
                <p className="text-[var(--text-primary)] font-medium mt-0.5">{formatDateTime(item.dateTime)}</p>
              </div>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-4 shadow-[var(--shadow-card)] space-y-3">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Manage Listing</span>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="secondary" iconLeft={<Edit2 size={13} />} onClick={() => setShowEdit(true)}>Edit</Button>
              {!isClosed && <Button size="sm" variant="outline" iconLeft={<CheckCircle size={13} />} onClick={() => setShowClaimed(true)}>Returned</Button>}
              <Button size="sm" variant="danger" iconLeft={<Trash2 size={13} />} onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
          </div>
        )}

        <SellerCard seller={item.user} createdAt={item.createdAt} isOwner={isOwner} isSold={isClosed} isFound onChat={onChat} />
      </div>

      {showEdit && <EditFoundPanel item={item} onClose={() => setShowEdit(false)} onSaved={(u) => { setItem(u); setShowEdit(false) }} />}
      <ActionConfirmModal
        open={showDelete}
        title="Delete Found Item Post?"
        desc="Are you sure you want to delete this found item report? This will remove it permanently."
        icon="🗑️"
        confirmLabel="Yes, Delete"
        danger
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
      <ActionConfirmModal
        open={showClaimed}
        title="Mark as Returned?"
        desc="This will mark the item as successfully returned to its rightful owner and archive this post."
        icon="✅"
        confirmLabel="Yes, Returned"
        onCancel={() => setShowClaimed(false)}
        onConfirm={handleClaimed}
        loading={marking}
      />
    </div>
  )
}

/* ---- Event Pass ------------------------------------------- */
function EventPassDetail({ pass, setPass, isOwner, onChat }: {
  pass: EventPass; setPass: (p: EventPass) => void; isOwner: boolean; onChat: () => void
}) {
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showSold, setShowSold] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/passes/${pass._id}`)
      toast.success('Pass deleted')
      navigate('/home')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  async function handleSold() {
    setMarking(true)
    try {
      const fd3 = new FormData()
      fd3.append('status', 'sold')
      const currentImgs = pass.images && pass.images.length > 0 ? pass.images : pass.imageUrl ? [{ url: pass.imageUrl, publicId: 'legacy' }] : []
      fd3.append('keepImagePublicIds', JSON.stringify(currentImgs.map((i) => i.publicId)))
      const res = await api.put(`/passes/${pass._id}`, fd3, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        setPass({ ...pass, ...res.data.data, status: 'sold', user: typeof res.data.data?.user === 'object' && res.data.data?.user ? res.data.data.user : pass.user })
        toast.success('Marked as sold!')
      }
    } catch {
      toast.error('Failed')
    } finally {
      setMarking(false)
      setShowSold(false)
    }
  }

  const isSold = pass.status === 'sold'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <ImageGallery images={pass.images && pass.images.length > 0 ? pass.images : pass.imageUrl ? [{ url: pass.imageUrl, publicId: 'legacy' }] : []} isSold={isSold} />
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{pass.name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="primary">{pass.category}</Badge>
              {pass.isNegotiable && <Badge variant="success">Negotiable</Badge>}
            </div>
          </div>
          {pass.description && (
            <div className="pt-2 border-t border-[var(--border-secondary)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Description</span>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed whitespace-pre-wrap">{pass.description}</p>
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[var(--color-primary-500)]">₹{pass.price.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-secondary)]">
            <div className="p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] block">Passes Left</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-1">{pass.quantity} available</span>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] block">Restrictions</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] block mt-1">{pass.ageRestriction ? `Age ${pass.ageRestriction}+` : 'None'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-secondary)] space-y-3">
            <div className="flex items-start gap-2.5 text-sm">
              <Calendar size={16} className="text-[var(--text-tertiary)] mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Event Time</span>
                <p className="text-[var(--text-primary)] font-medium mt-0.5">{formatDateTime(pass.dateTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin size={16} className="text-[var(--text-tertiary)] mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Venue</span>
                <p className="text-[var(--text-primary)] font-medium mt-0.5">{formatLocation(pass.venue)}</p>
              </div>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-4 shadow-[var(--shadow-card)] space-y-3">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Manage Listing</span>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="secondary" iconLeft={<Edit2 size={13} />} onClick={() => setShowEdit(true)}>Edit</Button>
              {!isSold && <Button size="sm" variant="outline" iconLeft={<CheckCircle size={13} />} onClick={() => setShowSold(true)}>Mark Sold</Button>}
              <Button size="sm" variant="danger" iconLeft={<Trash2 size={13} />} onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
          </div>
        )}

        <SellerCard seller={pass.user} createdAt={pass.createdAt} isOwner={isOwner} isSold={isSold} onChat={onChat} />
      </div>

      {showEdit && <EditPassPanel pass={pass} onClose={() => setShowEdit(false)} onSaved={(u) => { setPass(u); setShowEdit(false) }} />}
      <ActionConfirmModal
        open={showDelete}
        title="Delete Pass Listing?"
        desc="Are you sure you want to permanently delete this event pass listing? This action is permanent."
        icon="🗑️"
        confirmLabel="Yes, Delete"
        danger
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
      <ActionConfirmModal
        open={showSold}
        title="Mark as Sold?"
        desc="Mark this pass as sold out. Chats for it will be restricted."
        icon="🏷️"
        confirmLabel="Yes, Sold"
        onCancel={() => setShowSold(false)}
        onConfirm={handleSold}
        loading={marking}
      />
    </div>
  )
}

/* ---- Travel Ticket ---------------------------------------- */
function TravelTicketDetail({ ticket, setTicket, isOwner, onChat }: {
  ticket: TravelTicket; setTicket: (t: TravelTicket) => void; isOwner: boolean; onChat: () => void
}) {
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showSold, setShowSold] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/tickets/${ticket._id}`)
      toast.success('Ticket deleted')
      navigate('/home')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  async function handleSold() {
    setMarking(true)
    try {
      const res = await api.put(`/tickets/${ticket._id}`, { status: 'sold' })
      if (res.data.success) {
        setTicket({ ...ticket, ...res.data.data, status: 'sold', user: typeof res.data.data?.user === 'object' && res.data.data?.user ? res.data.data.user : ticket.user })
        toast.success('Marked as sold!')
      }
    } catch {
      toast.error('Failed to mark as sold')
    } finally {
      setMarking(false)
      setShowSold(false)
    }
  }

  const isSold = ticket.status === 'sold'
  const departure = new Date(ticket.departureTime)
  const arrival = new Date(ticket.arrivalTime)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Visual Boarding Pass layout on left */}
      <div className="lg:col-span-7 space-y-6">
        <div className="relative bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-[var(--radius-lg)] shadow-lg overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-[var(--color-primary-500)] text-white px-2 py-0.5 rounded-[var(--radius-sm)]">
                {ticket.ticketType[0]}
              </span>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">
                  {ticket.ticketType} Ticket
                </span>
                <span className="text-sm font-semibold">CAMPUS SHUTTLE</span>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              {isSold && <Badge variant="error">Sold</Badge>}
              <div>
                <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">Price</span>
                <span className="text-lg font-bold text-[var(--color-primary-500)]">₹{ticket.price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-5 flex items-center justify-between gap-6 relative">
            {/* Cutout notches */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[var(--bg-secondary)] rounded-r-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[var(--bg-secondary)] rounded-l-full" />

            <div className="w-5/12 text-left pl-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Origin</span>
              <span className="text-lg sm:text-xl font-bold tracking-tight block">{ticket.origin.city}</span>
              <span className="text-xs text-gray-300 block truncate">{ticket.origin.area}</span>
              <span className="text-sm font-semibold block mt-1.5">{departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs text-gray-400 block">{departure.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
            </div>

            <div className="w-2/12 flex flex-col items-center justify-center text-gray-500">
              <div className="w-full h-px border-t border-dashed border-gray-600 relative">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">✈️</span>
              </div>
            </div>

            <div className="w-5/12 text-right pr-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Destination</span>
              <span className="text-lg sm:text-xl font-bold tracking-tight block">{ticket.destination.city}</span>
              <span className="text-xs text-gray-300 block truncate">{ticket.destination.area}</span>
              <span className="text-sm font-semibold block mt-1.5">{arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs text-gray-400 block">{arrival.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>

          <div className="bg-slate-950/30 px-5 py-3 flex items-center justify-between text-xs text-gray-400 border-t border-white/5">
            <span>Available Seats: {ticket.quantity}</span>
            <span>Negotiable: {ticket.isNegotiable ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {ticket.description && (
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Listing Details / Instructions</span>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-[var(--color-primary-500)]">₹{ticket.price.toLocaleString()}</span>
            {ticket.isNegotiable && <Badge variant="success">Negotiable</Badge>}
          </div>
          <div className="pt-2 border-t border-[var(--border-secondary)] space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Ticket Type:</span>
              <span className="font-semibold">{ticket.ticketType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Departure Station:</span>
              <span className="font-semibold text-right">{ticket.origin.area}, {ticket.origin.city}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Destination:</span>
              <span className="font-semibold text-right">{ticket.destination.area}, {ticket.destination.city}</span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-4 shadow-[var(--shadow-card)] space-y-3">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Manage Listing</span>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" iconLeft={<Edit2 size={13} />} onClick={() => setShowEdit(true)}>Edit</Button>
              <Button size="sm" variant="danger" iconLeft={<Trash2 size={13} />} onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
            {!isSold && (
              <Button size="sm" variant="outline" fullWidth iconLeft={<CheckCircle size={13} />} onClick={() => setShowSold(true)}>Mark as Sold</Button>
            )}
          </div>
        )}

        <SellerCard seller={ticket.user} createdAt={ticket.createdAt} isOwner={isOwner} isSold={isSold} onChat={onChat} />
      </div>

      {showEdit && <EditTicketPanel ticket={ticket} onClose={() => setShowEdit(false)} onSaved={(u) => { setTicket(u); setShowEdit(false) }} />}
      <ActionConfirmModal
        open={showSold}
        title="Mark as Sold?"
        desc="Are you sure you want to mark this travel ticket as sold?"
        icon="🏷️"
        confirmLabel="Yes, Mark Sold"
        onCancel={() => setShowSold(false)}
        onConfirm={handleSold}
        loading={marking}
      />
      <ActionConfirmModal
        open={showDelete}
        title="Delete Ticket Listing?"
        desc="Are you sure you want to permanently delete this travel ticket listing?"
        icon="🗑️"
        confirmLabel="Yes, Delete"
        danger
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

/* ============================================================
   Main Page Layout Wrapper
   ============================================================ */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sellProduct, setSellProduct] = useState<SellProduct | null>(null)
  const [foundItem, setFoundItem] = useState<FoundItem | null>(null)
  const [eventPass, setEventPass] = useState<EventPass | null>(null)
  const [travelTicket, setTravelTicket] = useState<TravelTicket | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)

  const type = searchParams.get('type') || 'sell'

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    setSellProduct(null)
    setFoundItem(null)
    setEventPass(null)
    setTravelTicket(null)

    const endpoint =
      type === 'sell'   ? `/sell-products/${id}` :
      type === 'found'  ? `/found-products/${id}` :
      type === 'pass'   ? `/passes/${id}` :
      type === 'ticket' ? `/tickets/${id}` :
                          `/feed/details/${id}?type=${type}`

    api.get(endpoint)
      .then((res) => {
        if (!res.data.success) {
          setError('Item not found')
          return
        }
        const d = res.data.data
        if (type === 'sell') setSellProduct(d)
        else if (type === 'found') setFoundItem(d)
        else if (type === 'pass') setEventPass(d)
        else if (type === 'ticket') setTravelTicket(d)
      })
      .catch(() => setError('Failed to load item. Please try again.'))
      .finally(() => setLoading(false))
  }, [id, type])

  // Real-time synchronization: listen for admin item status changes
  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      const { itemId, status, product } = e.detail || {}
      if (!itemId || itemId !== id) return

      if (type === 'sell' && product) setSellProduct((p) => p ? { ...p, status } : null)
      else if (type === 'found' && product) setFoundItem((p) => p ? { ...p, status } : null)
      else if (type === 'pass' && product) setEventPass((p) => p ? { ...p, status } : null)
      else if (type === 'ticket' && product) setTravelTicket((p) => p ? { ...p, status } : null)
      
      toast(`Notice: Item status updated to ${status}`, { icon: 'ℹ️' })
    }

    window.addEventListener('findit_item_status_updated', handleStatusUpdate)
    return () => window.removeEventListener('findit_item_status_updated', handleStatusUpdate)
  }, [id, type])

  const currentItem = sellProduct || foundItem || eventPass || travelTicket
  const itemUserId = currentItem ? String((currentItem.user as Seller)?._id || currentItem.user) : ''
  const isOwner = !!(user && itemUserId && sameId(itemUserId, user._id))

  const breadcrumbMeta = {
    sell:   { label: 'For Sale', icon: '🛍️' },
    found:  { label: 'Found Item', icon: '🔍' },
    pass:   { label: 'Event Pass', icon: '🎟️' },
    ticket: { label: 'Travel Ticket', icon: '🚌' },
  }[type] || { label: 'Listing', icon: '📋' }

  const itemName = currentItem
    ? (currentItem as any).name ||
      (`${(currentItem as TravelTicket).origin?.city} → ${(currentItem as TravelTicket).destination?.city}`) ||
      'Item'
    : 'Item'
  const itemSeller = currentItem ? currentItem.user as Seller : null

  const itemImage = (currentItem as any)?.images?.[0]?.url || (currentItem as any)?.imageUrl || ''

  return (
    <div className="space-y-4 max-w-5xl mx-auto py-2">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
          <span className="hover:text-[var(--text-primary)] cursor-pointer" onClick={() => navigate('/home')}>Home</span>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1">
            <span>{breadcrumbMeta.icon}</span>
            {breadcrumbMeta.label}
          </span>
        </div>
      </div>

      {/* Main Details Body */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-tertiary)]">Loading item details...</p>
          </div>
        </div>
      ) : error || !currentItem ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-secondary)] p-6 space-y-4">
          <span className="text-5xl">😕</span>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Item Not Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs">{error || 'This item does not exist or has been deleted.'}</p>
          <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      ) : (
        <div className="animate-slide-up">
          {type === 'sell' && sellProduct && <SellProductDetail product={sellProduct} setProduct={setSellProduct} isOwner={isOwner} onChat={() => setShowChat(true)} />}
          {type === 'found' && foundItem && <FoundItemDetail item={foundItem} setItem={setFoundItem} isOwner={isOwner} onChat={() => setShowChat(true)} />}
          {type === 'pass' && eventPass && <EventPassDetail pass={eventPass} setPass={setEventPass} isOwner={isOwner} onChat={() => setShowChat(true)} />}
          {type === 'ticket' && travelTicket && <TravelTicketDetail ticket={travelTicket} setTicket={setTravelTicket} isOwner={isOwner} onChat={() => setShowChat(true)} />}
        </div>
      )}

      {showChat && itemSeller && (
        <QuickChatModal
          open={showChat}
          onClose={() => setShowChat(false)}
          seller={itemSeller}
          productName={itemName}
          isFound={type === 'found'}
          itemId={id}
          itemType={type}
          itemImage={itemImage}
        />
      )}
    </div>
  )
}
