import { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'
import Sidebar from '../../components/Sidebar/Sidebar'
import Topbar from '../../components/Topbar/Topbar'
import { getOrCreateConversation, sendMessage } from '../../services/chatService'

import '../../styles/variables.css'
import '../../styles/sidebar.css'
import '../../styles/topbar.css'
import './ProductDetail.css'

/* ============================================================
   Types
   ============================================================ */
interface ProductImage { url: string; publicId: string; width?: number; height?: number }

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
  description?: string; user: Seller; createdAt: string
}

/* ============================================================
   Constants
   ============================================================ */
const SELL_CATEGORIES = [
  'Electronics','Clothing & Accessories','Books & Stationery','Furniture & Home',
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

function formatWarranty(p: SellProduct): string {
  if (!p.hasWarranty) return 'No warranty'
  if (!p.warrantyValue) return 'Has warranty'
  return `${p.warrantyValue} ${p.warrantyUnit}`
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

function memberSince(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })
}

function formatLocation(loc: Location) {
  return [loc.area, loc.city, loc.state].filter(Boolean).join(', ')
}

function getPassIcon(cat: string) {
  return cat === 'Concert' ? '🎵' : cat === 'Movie' ? '🎬' : cat === 'Event' ? '🎪' : '🎟️'
}

function getTicketIcon(type: string) {
  return type === 'Bus' ? '🚌' : type === 'Train' ? '🚆' : type === 'Plane' ? '✈️' : '🎫'
}

function sameId(a?: string, b?: string) {
  if (!a || !b) return false
  return String(a).trim() === String(b).trim()
}

/* ============================================================
   Shared: Image Carousel
   ============================================================ */
function Lightbox({ images, startIndex, onClose }: {
  images: ProductImage[]; startIndex: number; onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const prev = () => setIdx(i => i === 0 ? images.length - 1 : i - 1)
  const next = () => setIdx(i => i === images.length - 1 ? 0 : i + 1)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx(i => i === 0 ? images.length - 1 : i - 1)
      if (e.key === 'ArrowRight') setIdx(i => i === images.length - 1 ? 0 : i + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return ReactDOM.createPortal(
    <div className="pd-lightbox" onClick={onClose}>
      <button className="pd-lightbox__close" onClick={onClose}>✕</button>
      <div className="pd-lightbox__content" onClick={e => e.stopPropagation()}>
        <img src={images[idx].url} alt={`Image ${idx + 1}`} className="pd-lightbox__img" />
        {images.length > 1 && <>
          <button className="pd-lightbox__arrow pd-lightbox__arrow--prev" onClick={prev}>‹</button>
          <button className="pd-lightbox__arrow pd-lightbox__arrow--next" onClick={next}>›</button>
          <span className="pd-lightbox__counter">{idx + 1} / {images.length}</span>
        </>}
      </div>
    </div>,
    document.body
  )
}

function ImageCarousel({ images, isSold, singleUrl }: {
  images?: ProductImage[]; isSold?: boolean; singleUrl?: string
}) {
  const all: ProductImage[] = images && images.length > 0
    ? images
    : singleUrl ? [{ url: singleUrl, publicId: 'single' }] : []
  const [active, setActive] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const prev = useCallback(() => setActive(i => i === 0 ? all.length - 1 : i - 1), [all.length])
  const next = useCallback(() => setActive(i => i === all.length - 1 ? 0 : i + 1), [all.length])

  if (!all.length) return (
    <div className="pd-gallery"><div className="pd-gallery__main">
      <div className="pd-gallery__placeholder"><span className="pd-gallery__placeholder-icon">📦</span></div>
    </div></div>
  )

  return (
    <div className="pd-gallery">
      {lightboxOpen && <Lightbox images={all} startIndex={active} onClose={() => setLightboxOpen(false)} />}
      <div className="pd-gallery__main">
        <img key={active} src={all[active].url} alt={`Image ${active + 1}`} className="pd-gallery__img" />
        {isSold && <div className="pd-gallery__sold-overlay"><span className="pd-gallery__sold-tag">SOLD</span></div>}
        {/* Fullscreen expand button — always visible */}
        <button className="pd-gallery__expand" onClick={() => setLightboxOpen(true)} title="View fullscreen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          Full View
        </button>
        {all.length > 1 && <>
          <span className="pd-gallery__counter">{active + 1} / {all.length}</span>
          <button className="pd-gallery__arrow pd-gallery__arrow--prev" onClick={prev}>‹</button>
          <button className="pd-gallery__arrow pd-gallery__arrow--next" onClick={next}>›</button>
          <div className="pd-gallery__dots">
            {all.map((_, i) => <button key={i} className={`pd-gallery__dot ${i === active ? 'pd-gallery__dot--active' : ''}`} onClick={() => setActive(i)} />)}
          </div>
        </>}
      </div>
      {all.length > 1 && (
        <div className="pd-gallery__thumbs">
          {all.map((img, i) => (
            <button key={i} className={`pd-gallery__thumb ${i === active ? 'pd-gallery__thumb--active' : ''}`} onClick={() => setActive(i)}>
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Shared: Seller Avatar
   ============================================================ */
function SellerAvatar({ seller, size = 48 }: { seller: Seller; size?: number }) {
  const [err, setErr] = useState(false)
  const init = seller.name?.[0]?.toUpperCase() || '?'
  if (seller.avatar && !err)
    return <img src={seller.avatar} alt={seller.name} className="pd-seller__avatar" style={{ width: size, height: size }} onError={() => setErr(true)} />
  return <div className="pd-seller__avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>{init}</div>
}

/* ============================================================
   Shared: Chat Modal
   ============================================================ */
const QUICK_MSGS = ['Is this still available?', 'Can you do a lower price?', "I'm interested. When can we meet?"]
const QUICK_MSGS_FOUND = ['Is this item still available?', 'I think this belongs to me.', 'Can I verify ownership details?']

function ChatModal({ seller, productName, isFound, itemId, itemType, itemImage, onClose }: {
  seller: Seller; productName: string; isFound?: boolean; itemId?: string; itemType?: string; itemImage?: string; onClose: () => void
}) {
  const quickMsgs = isFound ? QUICK_MSGS_FOUND : QUICK_MSGS
  const [quick, setQuick] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const effective = msg.trim() || quick || ''
  const navigate = useNavigate()

  function pickQuick(m: string) { setQuick(m); setMsg(m) }

  async function send() {
    if (!effective || sending) return
    setSending(true)
    try {
      const conv = await getOrCreateConversation({
        recipientId: seller._id,
        itemId,
        itemType,
        itemName: productName,
        itemImage
      })
      await sendMessage(conv._id, effective)
      toast.success('Message sent!')
      onClose()
      navigate(`/messages/${conv._id}`)
    } catch {
      toast.error('Failed to send message to ' + seller.name + '!')
    } finally { setSending(false) }
  }

  return (
    <div className="pd-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pd-modal">
        <div className="pd-modal__header">
          <div className="pd-modal__avatar">
            {seller.avatar ? <img src={seller.avatar} alt="" /> : seller.name?.[0]?.toUpperCase()}
          </div>
          <div className="pd-modal__title-block">
            <div className="pd-modal__seller-name">{seller.name}</div>
            <div className="pd-modal__seller-sub">Usually replies within an hour</div>
          </div>
          <button className="pd-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="pd-modal__body">
          <p className="pd-modal__intro">Send a message to <strong>{seller.name}</strong>.</p>
          <div className="pd-modal__quick-label">Quick Messages</div>
          <div className="pd-quick-msgs">
            {quickMsgs.map(m => (
              <button key={m} className={`pd-quick-msg-btn ${quick === m && msg === m ? 'pd-quick-msg-btn--selected' : ''}`} onClick={() => pickQuick(m)}>{m}</button>
            ))}
          </div>
          <textarea className="pd-modal__textarea" placeholder="Or type your own message..." value={msg}
            onChange={e => { setMsg(e.target.value); setQuick(null) }} />
          <button className="pd-modal__send-btn" disabled={!effective || sending} onClick={send}>
            ✈ {sending ? 'Sending…' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Shared: Confirm Dialogs
   ============================================================ */
function DeleteConfirm({ onCancel, onConfirm, loading }: { onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="pd-confirm-overlay">
      <div className="pd-confirm-box">
        <div className="pd-confirm-box__icon">🗑️</div>
        <div className="pd-confirm-box__title">Delete Listing?</div>
        <p className="pd-confirm-box__desc">This will permanently delete your listing. This action cannot be undone.</p>
        <div className="pd-confirm-box__actions">
          <button className="pd-confirm-box__cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="pd-confirm-box__confirm" onClick={onConfirm} disabled={loading}>{loading ? 'Deleting…' : 'Yes, Delete'}</button>
        </div>
      </div>
    </div>
  )
}

function SoldConfirm({ onCancel, onConfirm, loading }: { onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="pd-confirm-overlay">
      <div className="pd-confirm-box">
        <div className="pd-confirm-box__icon">🏷️</div>
        <div className="pd-confirm-box__title">Mark as Sold?</div>
        <p className="pd-confirm-box__desc">This will mark your listing as sold. Buyers won't be able to contact you.</p>
        <div className="pd-confirm-box__actions">
          <button className="pd-confirm-box__cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="pd-confirm-box__confirm" style={{ background:'#fff3ee', color:'var(--accent)', borderColor:'#ffd8c2' }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Updating…' : 'Yes, Mark Sold'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClaimedConfirm({ onCancel, onConfirm, loading }: { onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="pd-confirm-overlay">
      <div className="pd-confirm-box">
        <div className="pd-confirm-box__icon">✅</div>
        <div className="pd-confirm-box__title">Mark as Returned?</div>
        <p className="pd-confirm-box__desc">Mark this item as returned to its owner. The listing will be closed.</p>
        <div className="pd-confirm-box__actions">
          <button className="pd-confirm-box__cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="pd-confirm-box__confirm" style={{ background:'#e8f9f0', color:'#27ae60', borderColor:'#a3e4c0' }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Updating…' : '✓ Mark Returned'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Shared: Seller Card
   ============================================================ */
function SellerCard({ seller, createdAt, isOwner, isSold, isFound, onChat }: {
  seller: Seller; createdAt: string; isOwner: boolean; isSold?: boolean; isFound?: boolean; onChat: () => void
}) {
  const btnLabel = isFound ? '💬 Contact Finder' : '💬 Chat with Seller'
  const btnClass = isFound ? 'pd-chat-btn pd-chat-btn--green' : 'pd-chat-btn'

  return (
    <div className="pd-card">
      <div className="pd-seller">
        <SellerAvatar seller={seller} />
        <div className="pd-seller__info">
          <div className="pd-seller__name">{seller.name}<span className="pd-seller__verified">✓</span></div>
          <div className="pd-seller__meta">{seller.createdAt && `Member since ${memberSince(seller.createdAt)}`}</div>
        </div>
        <div className="pd-seller__posted">
          <span className="pd-seller__posted-label">Posted</span>
          {timeAgo(createdAt)}
        </div>
      </div>
      {!isOwner && !isSold && <button className={btnClass} onClick={onChat}>{btnLabel}</button>}
      {isOwner && <div style={{ marginTop:12, fontSize:13, color:'#aaa', textAlign:'center' }}>This is your listing</div>}
      {isSold && !isOwner && (
        <div style={{ marginTop:12, padding:'12px', background:'#fff0f0', borderRadius:10, textAlign:'center', fontSize:14, color:'#e74c3c', fontWeight:600 }}>
          This item has already been sold
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Shared: Multi-image editor (used by Sell, Found, Pass)
   ============================================================ */
interface MultiImageEditorProps {
  existing: ProductImage[]
  onExistingChange: (imgs: ProductImage[]) => void
  newFiles: File[]
  newPreviews: string[]
  onAdd: (files: File[]) => void
  onRemoveNew: (i: number) => void
  maxImages?: number
  note?: string
}

function MultiImageEditor({ existing, onExistingChange, newFiles, newPreviews, onAdd, onRemoveNew, maxImages = 5, note }: MultiImageEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const total = existing.length + newFiles.length

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    const allowed = maxImages - total
    onAdd(picked.slice(0, allowed))
    e.target.value = ''
  }

  return (
    <div>
      <div className="pd-field__label" style={{ marginBottom:10 }}>PHOTOS</div>
      <div className="pd-edit-images">
        {existing.map((img, i) => (
          <div key={img.publicId} className="pd-edit-img-thumb">
            <img src={img.url} alt="" />
            <button className="pd-edit-img-thumb__remove" onClick={() => onExistingChange(existing.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {newPreviews.map((src, i) => (
          <div key={i} className="pd-edit-img-thumb">
            <img src={src} alt="" />
            <button className="pd-edit-img-thumb__remove" onClick={() => onRemoveNew(i)}>✕</button>
          </div>
        ))}
        {total < maxImages && (
          <button className="pd-edit-add-photos" onClick={() => fileRef.current?.click()}>+</button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handlePick} />
      {newFiles.length > 0 && <p style={{ fontSize:12, color:'#e67e22', marginTop:6 }}>{note || '⚠️ New photos will be added alongside existing ones.'}</p>}
    </div>
  )
}

function useImageEditor(maxImages = 5) {
  const [existing, setExisting] = useState<ProductImage[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  function initExisting(imgs: ProductImage[]) { setExisting(imgs); setNewFiles([]); setNewPreviews([]) }

  function addFiles(files: File[]) {
    const total = existing.length + newFiles.length
    const allowed = maxImages - total
    const toAdd = files.slice(0, allowed)
    setNewFiles(p => [...p, ...toAdd])
    setNewPreviews(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))])
  }

  function removeNew(i: number) {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles(p => p.filter((_, j) => j !== i))
    setNewPreviews(p => p.filter((_, j) => j !== i))
  }

  return { existing, setExisting, newFiles, newPreviews, initExisting, addFiles, removeNew }
}

/* ============================================================
   Edit Sell Product
   ============================================================ */
interface EditSellForm {
  name:string; category:string; description:string; productUrl:string
  sellingPrice:string; purchasePrice:string; quantity:string
  usageYears:string; usageMonths:string; usageDays:string
  warrantyDuration:string; warrantyUnit:string
}

function EditSellPanel({ product, onClose, onSaved }: {
  product: SellProduct; onClose: () => void; onSaved: (u: SellProduct) => void
}) {
  const imgEd = useImageEditor(5)
  const [form, setForm] = useState<EditSellForm>({
    name: product.name, category: product.category,
    description: product.description||'', productUrl: product.productURL||'',
    sellingPrice: String(product.sellingPrice),
    purchasePrice: product.purchasePrice ? String(product.purchasePrice) : '',
    quantity: String(product.quantity),
    usageYears: String(product.usageTime?.years||0),
    usageMonths: String(product.usageTime?.months||0),
    usageDays: String(product.usageTime?.days||0),
    warrantyDuration: product.warrantyValue ? String(product.warrantyValue) : '',
    warrantyUnit: product.warrantyUnit||'months',
  })
  const [hasWarranty, setHasWarranty] = useState(product.hasWarranty)
  const [isNegotiable, setIsNegotiable] = useState(product.isNegotiable)
  const [saving, setSaving] = useState(false)

  useEffect(() => { imgEd.initExisting(product.images) }, [])

  function sf<K extends keyof EditSellForm>(k: K, v: EditSellForm[K]) { setForm(f => ({...f,[k]:v})) }

  async function save() {
    if (saving) return
    if (!form.name.trim()) { toast.error('Name required'); return }
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice))) { toast.error('Valid price required'); return }
    if (!imgEd.existing.length && !imgEd.newFiles.length) { toast.error('At least one image required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('category', form.category)
      fd.append('description', form.description.trim())
      fd.append('productURL', form.productUrl.trim())
      fd.append('sellingPrice', form.sellingPrice)
      fd.append('purchasePrice', form.purchasePrice)
      fd.append('quantity', form.quantity)
      fd.append('isNegotiable', String(isNegotiable))
      fd.append('hasWarranty', String(hasWarranty))
      fd.append('usageTime', JSON.stringify({ years: form.usageYears||'0', months: form.usageMonths||'0', days: form.usageDays||'0' }))
      if (hasWarranty) { fd.append('warrantyValue', form.warrantyDuration); fd.append('warrantyUnit', form.warrantyUnit) }
      if (imgEd.newFiles.length) imgEd.newFiles.forEach(f => fd.append('images', f))
      const res = await api.put(`/sell-products/${product._id}`, fd, { headers: {'Content-Type':'multipart/form-data'} })
      if (res.data.success) { toast.success('Updated!'); onSaved(res.data.data) }
    } catch(e:any) { toast.error(e?.response?.data?.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className="pd-edit-overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="pd-edit-panel">
        <div className="pd-edit-panel__header">
          <span className="pd-edit-panel__title">✏️ Edit Listing</span>
          <button className="pd-edit-panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="pd-edit-panel__body">
          <MultiImageEditor
            existing={imgEd.existing} onExistingChange={imgEd.setExisting}
            newFiles={imgEd.newFiles} newPreviews={imgEd.newPreviews}
            onAdd={imgEd.addFiles} onRemoveNew={imgEd.removeNew} maxImages={5}
            note="⚠️ New photos will replace existing images on save."
          />
          <div className="pd-field">
            <label className="pd-field__label">Product Name *</label>
            <input className="pd-field__input" value={form.name} onChange={e=>sf('name',e.target.value)} />
          </div>
          <div className="pd-field">
            <label className="pd-field__label">Category *</label>
            <select className="pd-field__select" value={form.category} onChange={e=>sf('category',e.target.value)}>
              <option value="">Select</option>
              {SELL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pd-field">
            <label className="pd-field__label">Description</label>
            <textarea className="pd-field__textarea" value={form.description} onChange={e=>sf('description',e.target.value)} maxLength={1000} />
          </div>
          <div className="pd-field">
            <label className="pd-field__label">Product URL <span style={{fontWeight:400,color:'#ccc'}}>(optional)</span></label>
            <input className="pd-field__input" value={form.productUrl} onChange={e=>sf('productUrl',e.target.value)} placeholder="https://..." />
          </div>
          <div className="pd-edit__two-col">
            <div className="pd-field"><label className="pd-field__label">Selling Price (₹) *</label>
              <input className="pd-field__input" type="number" min="0" value={form.sellingPrice} onChange={e=>sf('sellingPrice',e.target.value)} /></div>
            <div className="pd-field"><label className="pd-field__label">Original Price (₹)</label>
              <input className="pd-field__input" type="number" min="0" value={form.purchasePrice} onChange={e=>sf('purchasePrice',e.target.value)} /></div>
          </div>
          <div className="pd-edit__two-col">
            <div className="pd-field"><label className="pd-field__label">Quantity *</label>
              <input className="pd-field__input" type="number" min="1" value={form.quantity} onChange={e=>sf('quantity',e.target.value)} /></div>
            <div className="pd-field"><label className="pd-field__label">Negotiable?</label>
              <div className="pd-toggle-row">
                <button className={`pd-toggle-btn ${isNegotiable?'pd-toggle-btn--active':''}`} onClick={()=>setIsNegotiable(true)} type="button">Yes</button>
                <button className={`pd-toggle-btn ${!isNegotiable?'pd-toggle-btn--active':''}`} onClick={()=>setIsNegotiable(false)} type="button">No</button>
              </div></div>
          </div>
          <div className="pd-field">
            <label className="pd-field__label">Usage Time</label>
            <div className="pd-edit__three-col">
              {(['usageYears','usageMonths','usageDays'] as const).map((k,i)=>(
                <div key={k} className="pd-field"><label className="pd-field__label">{['Years','Months','Days'][i]}</label>
                  <input className="pd-field__input" type="number" min="0" value={form[k]} onChange={e=>sf(k,e.target.value)} /></div>
              ))}
            </div>
          </div>
          <div className="pd-field">
            <label className="pd-field__label">Warranty</label>
            <div className="pd-toggle-row" style={{marginBottom:10}}>
              <button className={`pd-toggle-btn ${hasWarranty?'pd-toggle-btn--active':''}`} onClick={()=>setHasWarranty(true)} type="button">Yes</button>
              <button className={`pd-toggle-btn ${!hasWarranty?'pd-toggle-btn--active':''}`} onClick={()=>setHasWarranty(false)} type="button">No</button>
            </div>
            {hasWarranty && (
              <div className="pd-edit__two-col">
                <div className="pd-field"><label className="pd-field__label">Duration</label>
                  <input className="pd-field__input" type="number" min="1" value={form.warrantyDuration} onChange={e=>sf('warrantyDuration',e.target.value)} /></div>
                <div className="pd-field"><label className="pd-field__label">Unit</label>
                  <select className="pd-field__select" value={form.warrantyUnit} onChange={e=>sf('warrantyUnit',e.target.value)}>
                    <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
                  </select></div>
              </div>
            )}
          </div>
          <div className="pd-edit__actions">
            <button className="pd-edit__cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="pd-edit__save-btn" onClick={save} disabled={saving}>{saving?'⏳ Saving…':'✓ Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Edit Event Pass  — single image, same grid UI
   ============================================================ */
interface EditPassForm {
  name:string; category:string; description:string
  price:string; quantity:string; dateTime:string
  venueArea:string; venueCity:string; venueState:string
  ageRestriction:string
}

function EditPassPanel({ pass, onClose, onSaved }: {
  pass: EventPass; onClose: () => void; onSaved: (u: EventPass) => void
}) {
  const imgEd = useImageEditor(5)
  const [form, setForm] = useState<EditPassForm>({
    name: pass.name, category: pass.category, description: pass.description||'',
    price: String(pass.price), quantity: String(pass.quantity),
    dateTime: pass.dateTime ? new Date(pass.dateTime).toISOString().slice(0,16) : '',
    venueArea: pass.venue.area, venueCity: pass.venue.city, venueState: pass.venue.state,
    ageRestriction: pass.ageRestriction ? String(pass.ageRestriction) : '',
  })
  const [isNegotiable, setIsNegotiable] = useState(pass.isNegotiable)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Seed the image editor with existing images (supports both array and legacy single imageUrl)
    const existing: ProductImage[] = pass.images && pass.images.length > 0
      ? pass.images
      : pass.imageUrl ? [{ url: pass.imageUrl, publicId: 'legacy' }] : []
    imgEd.initExisting(existing)
  }, [])

  function sf<K extends keyof EditPassForm>(k: K, v: EditPassForm[K]) { setForm(f=>({...f,[k]:v})) }

  async function save() {
    if (saving) return
    if (!form.name.trim()) { toast.error('Name required'); return }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price required'); return }
    if (!imgEd.existing.length && !imgEd.newFiles.length) { toast.error('At least one image required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('category', form.category)
      fd.append('description', form.description.trim())
      fd.append('price', form.price)
      fd.append('quantity', form.quantity)
      fd.append('dateTime', form.dateTime)
      fd.append('venue', JSON.stringify({ area: form.venueArea, city: form.venueCity, state: form.venueState }))
      fd.append('isNegotiable', String(isNegotiable))
      if (form.ageRestriction) fd.append('ageRestriction', form.ageRestriction)
      // Tell backend which existing images to keep
      fd.append('keepImagePublicIds', JSON.stringify(imgEd.existing.map(i => i.publicId)))
      imgEd.newFiles.forEach(f => fd.append('images', f))
      const res = await api.put(`/passes/${pass._id}`, fd, { headers: { 'Content-Type':'multipart/form-data' } })
      if (res.data.success) { toast.success('Pass updated!'); onSaved(res.data.data) }
    } catch(e:any) { toast.error(e?.response?.data?.message||'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className="pd-edit-overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="pd-edit-panel">
        <div className="pd-edit-panel__header">
          <span className="pd-edit-panel__title">✏️ Edit Pass</span>
          <button className="pd-edit-panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="pd-edit-panel__body">
          <MultiImageEditor
            existing={imgEd.existing} onExistingChange={imgEd.setExisting}
            newFiles={imgEd.newFiles} newPreviews={imgEd.newPreviews}
            onAdd={imgEd.addFiles} onRemoveNew={imgEd.removeNew} maxImages={5}
          />

          <div className="pd-field"><label className="pd-field__label">Pass Name *</label>
            <input className="pd-field__input" value={form.name} onChange={e=>sf('name',e.target.value)} /></div>
          <div className="pd-field"><label className="pd-field__label">Category *</label>
            <select className="pd-field__select" value={form.category} onChange={e=>sf('category',e.target.value)}>
              {PASS_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select></div>
          <div className="pd-field"><label className="pd-field__label">Description</label>
            <textarea className="pd-field__textarea" value={form.description} onChange={e=>sf('description',e.target.value)} /></div>
          <div className="pd-edit__two-col">
            <div className="pd-field"><label className="pd-field__label">Price (₹) *</label>
              <input className="pd-field__input" type="number" min="0" value={form.price} onChange={e=>sf('price',e.target.value)} /></div>
            <div className="pd-field"><label className="pd-field__label">Quantity *</label>
              <input className="pd-field__input" type="number" min="1" value={form.quantity} onChange={e=>sf('quantity',e.target.value)} /></div>
          </div>
          <div className="pd-field"><label className="pd-field__label">Negotiable?</label>
            <div className="pd-toggle-row">
              <button className={`pd-toggle-btn ${isNegotiable?'pd-toggle-btn--active':''}`} onClick={()=>setIsNegotiable(true)} type="button">Yes</button>
              <button className={`pd-toggle-btn ${!isNegotiable?'pd-toggle-btn--active':''}`} onClick={()=>setIsNegotiable(false)} type="button">No</button>
            </div></div>
          <div className="pd-field"><label className="pd-field__label">Event Date &amp; Time</label>
            <input className="pd-field__input" type="datetime-local" value={form.dateTime} onChange={e=>sf('dateTime',e.target.value)} /></div>
          <div className="pd-field"><label className="pd-field__label">Venue</label>
            <div className="pd-edit__three-col">
              <div className="pd-field"><label className="pd-field__label">Area</label>
                <input className="pd-field__input" value={form.venueArea} onChange={e=>sf('venueArea',e.target.value)} /></div>
              <div className="pd-field"><label className="pd-field__label">City</label>
                <input className="pd-field__input" value={form.venueCity} onChange={e=>sf('venueCity',e.target.value)} /></div>
              <div className="pd-field"><label className="pd-field__label">State</label>
                <input className="pd-field__input" value={form.venueState} onChange={e=>sf('venueState',e.target.value)} /></div>
            </div></div>
          <div className="pd-field"><label className="pd-field__label">Age Restriction <span style={{fontWeight:400,color:'#ccc'}}>(optional)</span></label>
            <input className="pd-field__input" type="number" min="0" value={form.ageRestriction} onChange={e=>sf('ageRestriction',e.target.value)} placeholder="e.g. 18" /></div>
          <div className="pd-edit__actions">
            <button className="pd-edit__cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="pd-edit__save-btn" onClick={save} disabled={saving}>{saving?'⏳ Saving…':'✓ Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Edit Travel Ticket
   ============================================================ */
interface EditTicketForm {
  ticketType:string; description:string; price:string; quantity:string
  departureTime:string; arrivalTime:string
  originArea:string; originCity:string; originState:string
  destArea:string; destCity:string; destState:string
}

function EditTicketPanel({ ticket, onClose, onSaved }: {
  ticket: TravelTicket; onClose: () => void; onSaved: (u: TravelTicket) => void
}) {
  const [form, setForm] = useState<EditTicketForm>({
    ticketType: ticket.ticketType, description: ticket.description||'',
    price: String(ticket.price), quantity: String(ticket.quantity),
    departureTime: ticket.departureTime ? new Date(ticket.departureTime).toISOString().slice(0,16) : '',
    arrivalTime: ticket.arrivalTime ? new Date(ticket.arrivalTime).toISOString().slice(0,16) : '',
    originArea: ticket.origin.area, originCity: ticket.origin.city, originState: ticket.origin.state,
    destArea: ticket.destination.area, destCity: ticket.destination.city, destState: ticket.destination.state,
  })
  const [isNegotiable, setIsNegotiable] = useState(ticket.isNegotiable)
  const [saving, setSaving] = useState(false)

  function sf<K extends keyof EditTicketForm>(k:K, v:EditTicketForm[K]) { setForm(f=>({...f,[k]:v})) }

  async function save() {
    if (saving) return
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price required'); return }
    setSaving(true)
    try {
      const res = await api.put(`/tickets/${ticket._id}`, {
        ticketType: form.ticketType,
        description: form.description.trim(),
        price: form.price, quantity: form.quantity,
        isNegotiable: String(isNegotiable),
        departureTime: form.departureTime, arrivalTime: form.arrivalTime,
        origin: JSON.stringify({ area: form.originArea, city: form.originCity, state: form.originState }),
        destination: JSON.stringify({ area: form.destArea, city: form.destCity, state: form.destState }),
      })
      if (res.data.success) { toast.success('Ticket updated!'); onSaved(res.data.data) }
    } catch(e:any) { toast.error(e?.response?.data?.message||'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className="pd-edit-overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="pd-edit-panel">
        <div className="pd-edit-panel__header">
          <span className="pd-edit-panel__title">✏️ Edit Ticket</span>
          <button className="pd-edit-panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="pd-edit-panel__body">
          <div className="pd-field"><label className="pd-field__label">Ticket Type *</label>
            <select className="pd-field__select" value={form.ticketType} onChange={e=>sf('ticketType',e.target.value)}>
              {['Bus','Train','Plane'].map(t=><option key={t} value={t}>{getTicketIcon(t)} {t}</option>)}
            </select></div>
          <div className="pd-edit__two-col">
            <div className="pd-field"><label className="pd-field__label">Price (₹) *</label>
              <input className="pd-field__input" type="number" min="0" value={form.price} onChange={e=>sf('price',e.target.value)} /></div>
            <div className="pd-field"><label className="pd-field__label">Seats/Qty *</label>
              <input className="pd-field__input" type="number" min="1" value={form.quantity} onChange={e=>sf('quantity',e.target.value)} /></div>
          </div>
          <div className="pd-field"><label className="pd-field__label">Negotiable?</label>
            <div className="pd-toggle-row">
              <button className={`pd-toggle-btn ${isNegotiable?'pd-toggle-btn--active':''}`} onClick={()=>setIsNegotiable(true)} type="button">Yes</button>
              <button className={`pd-toggle-btn ${!isNegotiable?'pd-toggle-btn--active':''}`} onClick={()=>setIsNegotiable(false)} type="button">No</button>
            </div></div>
          <div className="pd-edit__two-col">
            <div className="pd-field"><label className="pd-field__label">Departure</label>
              <input className="pd-field__input" type="datetime-local" value={form.departureTime} onChange={e=>sf('departureTime',e.target.value)} /></div>
            <div className="pd-field"><label className="pd-field__label">Arrival</label>
              <input className="pd-field__input" type="datetime-local" value={form.arrivalTime} onChange={e=>sf('arrivalTime',e.target.value)} /></div>
          </div>
          <div className="pd-field"><label className="pd-field__label">Origin</label>
            <div className="pd-edit__three-col">
              {[['originArea','Area'],['originCity','City'],['originState','State']] .map(([k,l])=>(
                <div key={k} className="pd-field"><label className="pd-field__label">{l}</label>
                  <input className="pd-field__input" value={form[k as keyof EditTicketForm]} onChange={e=>sf(k as keyof EditTicketForm,e.target.value)} /></div>
              ))}
            </div></div>
          <div className="pd-field"><label className="pd-field__label">Destination</label>
            <div className="pd-edit__three-col">
              {[['destArea','Area'],['destCity','City'],['destState','State']].map(([k,l])=>(
                <div key={k} className="pd-field"><label className="pd-field__label">{l}</label>
                  <input className="pd-field__input" value={form[k as keyof EditTicketForm]} onChange={e=>sf(k as keyof EditTicketForm,e.target.value)} /></div>
              ))}
            </div></div>
          <div className="pd-field"><label className="pd-field__label">Description</label>
            <textarea className="pd-field__textarea" value={form.description} onChange={e=>sf('description',e.target.value)} /></div>
          <div className="pd-edit__actions">
            <button className="pd-edit__cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="pd-edit__save-btn" onClick={save} disabled={saving}>{saving?'⏳ Saving…':'✓ Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Edit Found Item
   ============================================================ */
interface EditFoundForm {
  name:string; category:string; description:string; venue:string; dateTime:string
}

function EditFoundPanel({ item, onClose, onSaved }: {
  item: FoundItem; onClose: () => void; onSaved: (u: FoundItem) => void
}) {
  const imgEd = useImageEditor(5)
  const [form, setForm] = useState<EditFoundForm>({
    name: item.name, category: item.category, description: item.description||'',
    venue: item.venue,
    dateTime: item.dateTime ? new Date(item.dateTime).toISOString().slice(0,16) : '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { imgEd.initExisting(item.images) }, [])

  function sf<K extends keyof EditFoundForm>(k: K, v: EditFoundForm[K]) { setForm(f=>({...f,[k]:v})) }

  async function save() {
    if (saving) return
    if (!form.name.trim()) { toast.error('Name required'); return }
    if (!imgEd.existing.length && !imgEd.newFiles.length) { toast.error('At least one image required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('category', form.category)
      fd.append('description', form.description.trim())
      fd.append('venue', form.venue.trim())
      fd.append('dateTime', form.dateTime)
      // Tell backend which existing images to keep
      fd.append('keepImagePublicIds', JSON.stringify(imgEd.existing.map(i => i.publicId)))
      imgEd.newFiles.forEach(f => fd.append('images', f))
      const res = await api.put(`/found-products/${item._id}`, fd, { headers: { 'Content-Type':'multipart/form-data' } })
      if (res.data.success) { toast.success('Updated!'); onSaved(res.data.data) }
    } catch(e:any) { toast.error(e?.response?.data?.message||'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className="pd-edit-overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="pd-edit-panel">
        <div className="pd-edit-panel__header">
          <span className="pd-edit-panel__title">✏️ Edit Found Item</span>
          <button className="pd-edit-panel__close" onClick={onClose}>✕</button>
        </div>
        <div className="pd-edit-panel__body">
          <MultiImageEditor
            existing={imgEd.existing} onExistingChange={imgEd.setExisting}
            newFiles={imgEd.newFiles} newPreviews={imgEd.newPreviews}
            onAdd={imgEd.addFiles} onRemoveNew={imgEd.removeNew} maxImages={5}
          />
          <div className="pd-field"><label className="pd-field__label">Item Name *</label>
            <input className="pd-field__input" value={form.name} onChange={e=>sf('name',e.target.value)} /></div>
          <div className="pd-field"><label className="pd-field__label">Category *</label>
            <select className="pd-field__select" value={form.category} onChange={e=>sf('category',e.target.value)}>
              {FOUND_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select></div>
          <div className="pd-field"><label className="pd-field__label">Description</label>
            <textarea className="pd-field__textarea" value={form.description} onChange={e=>sf('description',e.target.value)} maxLength={1000} /></div>
          <div className="pd-field"><label className="pd-field__label">Found At (Location) *</label>
            <input className="pd-field__input" value={form.venue} onChange={e=>sf('venue',e.target.value)} placeholder="e.g. Central Park, near the fountain" /></div>
          <div className="pd-field"><label className="pd-field__label">Date &amp; Time Found</label>
            <input className="pd-field__input" type="datetime-local" value={form.dateTime} onChange={e=>sf('dateTime',e.target.value)} /></div>
          <div className="pd-edit__actions">
            <button className="pd-edit__cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="pd-edit__save-btn" onClick={save} disabled={saving}>{saving?'⏳ Saving…':'✓ Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Type-specific detail views
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
    try { await api.delete(`/sell-products/${product._id}`); toast.success('Deleted'); navigate('/home') }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false); setShowDelete(false) }
  }

  async function handleSold() {
    setMarking(true)
    try {
      const res = await api.put(`/sell-products/${product._id}`, { status:'sold' })
      if (res.data.success) { setProduct(res.data.data); toast.success('Marked as sold!') }
    } catch { toast.error('Failed') }
    finally { setMarking(false); setShowSold(false) }
  }

  return (
    <>
      <ImageCarousel images={product.images} isSold={product.status==='sold'} />
      <div className="pd-card">
        <div className="pd-info__header">
          <h1 className="pd-info__name">{product.name}</h1>
          <span className="pd-info__cat-badge">{product.category}</span>
        </div>
        <div className="pd-info__pricing">
          <span className="pd-price">₹{product.sellingPrice.toLocaleString()}</span>
          {product.purchasePrice && product.purchasePrice > product.sellingPrice && (
            <><span className="pd-price-original">₹{product.purchasePrice.toLocaleString()}</span>
              {discountPct(product.sellingPrice, product.purchasePrice) !== null &&
                <span className="pd-discount-badge">{discountPct(product.sellingPrice,product.purchasePrice)}% off</span>}
            </>
          )}
          {product.isNegotiable && <span className="pd-negotiable-badge">Negotiable</span>}
        </div>
        <div className="pd-info__chips">
          <span className="pd-chip">Used: {formatUsageTime(product.usageTime)}</span>
          <span className="pd-chip">Qty: {product.quantity}</span>
          {product.hasWarranty && <span className="pd-chip pd-chip--warranty">Warranty: {formatWarranty(product)}</span>}
        </div>
      </div>
      {product.description && <div className="pd-card"><h2 className="pd-section-title">Description</h2><p className="pd-desc-text">{product.description}</p></div>}
      <div className="pd-card">
        <h2 className="pd-section-title">Item Details</h2>
        <div className="pd-details-list">
          {[
            { icon:'📦', label:'Category', value:product.category },
            { icon:'🕐', label:'Usage Time', value:formatUsageTime(product.usageTime) },
            { icon:'🛡️', label:'Warranty', value:formatWarranty(product) },
            { icon:'🔄', label:'Negotiable', value:product.isNegotiable?'Yes, open to offers':'No, fixed price', orange:true },
            { icon:'#', label:'Quantity', value:`${product.quantity} unit${product.quantity!==1?'s':''} available` },
          ].map(r => (
            <div key={r.label} className="pd-detail-row">
              <div className={`pd-detail-icon ${r.orange?'pd-detail-icon--orange':''}`}>{r.icon}</div>
              <div className="pd-detail-body"><span className="pd-detail-label">{r.label}</span><span className="pd-detail-value">{r.value}</span></div>
            </div>
          ))}
          {/* Only render product link row if URL is provided */}
          {product.productURL && product.productURL.trim() !== '' && (
            <div className="pd-detail-row">
              <div className="pd-detail-icon">🔗</div>
              <div className="pd-detail-body"><span className="pd-detail-label">Product Link</span>
                <a href={product.productURL} target="_blank" rel="noopener noreferrer" className="pd-detail-link">View original listing ↗</a>
              </div>
            </div>
          )}
        </div>
      </div>
      {isOwner && (
        <div className="pd-card">
          <h2 className="pd-section-title">Manage Listing</h2>
          <div className="pd-owner-bar">
            <button className="pd-owner-btn pd-owner-btn--edit" onClick={()=>setShowEdit(true)}>✏️ Edit Listing</button>
            {product.status!=='sold' && <button className="pd-owner-btn pd-owner-btn--sold" onClick={()=>setShowSold(true)}>🏷️ Mark as Sold</button>}
            <button className="pd-owner-btn pd-owner-btn--delete" onClick={()=>setShowDelete(true)}>🗑️ Delete</button>
          </div>
        </div>
      )}
      <SellerCard seller={product.user} createdAt={product.createdAt} isOwner={isOwner} isSold={product.status==='sold'} onChat={onChat} />
      {showEdit && <EditSellPanel product={product} onClose={()=>setShowEdit(false)} onSaved={u=>{setProduct(u);setShowEdit(false)}} />}
      {showDelete && <DeleteConfirm onCancel={()=>setShowDelete(false)} onConfirm={handleDelete} loading={deleting} />}
      {showSold && <SoldConfirm onCancel={()=>setShowSold(false)} onConfirm={handleSold} loading={marking} />}
    </>
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
    try { await api.delete(`/found-products/${item._id}`); toast.success('Listing deleted'); navigate('/home') }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false); setShowDelete(false) }
  }

  async function handleClaimed() {
    setMarking(true)
    try {
      const fd2 = new FormData(); fd2.append('status', 'sold')
      const res = await api.put(`/found-products/${item._id}`, fd2, { headers: {'Content-Type':'multipart/form-data'} })
      if (res.data.success) { setItem({ ...item, status:'sold' }); toast.success('Marked as returned!') }
    } catch { toast.error('Failed to update') }
    finally { setMarking(false); setShowClaimed(false) }
  }

  return (
    <>
      <ImageCarousel images={item.images} isSold={isClosed} />

      {/* Main info card — green-themed */}
      <div className="pd-card pd-card--found">
        <div className="pd-info__header">
          <h1 className="pd-info__name">{item.name}</h1>
          <span className="pd-found-badge">{isClosed ? 'Returned' : 'Found'}</span>
        </div>
        <span className="pd-info__cat-badge pd-info__cat-badge--green">{item.category}</span>
        <div className="pd-found-alert">
          <span className="pd-found-alert__icon">ℹ️</span>
          <span>This item was found and reported. If it belongs to you, please contact the finder with details to verify ownership.</span>
        </div>
      </div>

      {/* Found Details */}
      <div className="pd-card">
        <h2 className="pd-section-title">FOUND DETAILS</h2>
        <div className="pd-details-list">
          <div className="pd-detail-row">
            <div className="pd-detail-icon">📍</div>
            <div className="pd-detail-body"><span className="pd-detail-label">Found At</span><span className="pd-detail-value">{item.venue}</span></div>
          </div>
          <div className="pd-detail-row">
            <div className="pd-detail-icon">📅</div>
            <div className="pd-detail-body"><span className="pd-detail-label">Date &amp; Time</span><span className="pd-detail-value">{formatDateTime(item.dateTime)}</span></div>
          </div>
        </div>
      </div>

      {item.description && (
        <div className="pd-card">
          <h2 className="pd-section-title">DESCRIPTION</h2>
          <p className="pd-desc-text">{item.description}</p>
        </div>
      )}

      {isOwner && (
        <div className="pd-card">
          <h2 className="pd-section-title">Manage Listing</h2>
          <div className="pd-owner-bar">
            <button className="pd-owner-btn pd-owner-btn--edit" onClick={()=>setShowEdit(true)}>✏️ Edit Item</button>
            {!isClosed && <button className="pd-owner-btn pd-owner-btn--claimed" onClick={()=>setShowClaimed(true)}>✅ Mark as Returned</button>}
            <button className="pd-owner-btn pd-owner-btn--delete" onClick={()=>setShowDelete(true)}>🗑️ Delete</button>
          </div>
        </div>
      )}

      <SellerCard seller={item.user} createdAt={item.createdAt} isOwner={isOwner} isSold={isClosed} isFound onChat={onChat} />
      {showEdit && <EditFoundPanel item={item} onClose={()=>setShowEdit(false)} onSaved={u=>{setItem(u);setShowEdit(false)}} />}
      {showDelete && <DeleteConfirm onCancel={()=>setShowDelete(false)} onConfirm={handleDelete} loading={deleting} />}
      {showClaimed && <ClaimedConfirm onCancel={()=>setShowClaimed(false)} onConfirm={handleClaimed} loading={marking} />}
    </>
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
  const catIcon = getPassIcon(pass.category)

  async function handleDelete() {
    setDeleting(true)
    try { await api.delete(`/passes/${pass._id}`); toast.success('Pass deleted'); navigate('/home') }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false); setShowDelete(false) }
  }

  async function handleSold() {
    setMarking(true)
    try {
      const fd3 = new FormData()
      fd3.append('status', 'sold')
      // preserve existing images
      const currentImgs = pass.images && pass.images.length > 0 ? pass.images : pass.imageUrl ? [{url:pass.imageUrl,publicId:'legacy'}] : []
      fd3.append('keepImagePublicIds', JSON.stringify(currentImgs.map((i: ProductImage) => i.publicId)))
      const res = await api.put(`/passes/${pass._id}`, fd3, { headers: { 'Content-Type':'multipart/form-data' } })
      if (res.data.success) { setPass({ ...pass, status:'sold' }); toast.success('Marked as sold!') }
    } catch { toast.error('Failed') }
    finally { setMarking(false); setShowSold(false) }
  }

  return (
    <>
      <ImageCarousel images={pass.images && pass.images.length > 0 ? pass.images : pass.imageUrl ? [{url: pass.imageUrl, publicId:'legacy'}] : []} isSold={pass.status==='sold'} />
      <div className="pd-card">
        <div className="pd-info__header">
          <h1 className="pd-info__name">{pass.name}</h1>
          <span className="pd-info__cat-badge">{catIcon} {pass.category}</span>
        </div>
        <div className="pd-info__pricing">
          <span className="pd-price">₹{pass.price.toLocaleString()}</span>
          {pass.isNegotiable && <span className="pd-negotiable-badge">Negotiable</span>}
        </div>
        <div className="pd-info__chips">
          <span className="pd-chip">{pass.quantity} available</span>
          {pass.ageRestriction && <span className="pd-chip">Age {pass.ageRestriction}+</span>}
        </div>
      </div>
      <div className="pd-card">
        <h2 className="pd-section-title">Event Info</h2>
        <div className="pd-details-list">
          <div className="pd-detail-row">
            <div className="pd-detail-icon pd-detail-icon--orange">📅</div>
            <div className="pd-detail-body"><span className="pd-detail-label">Date &amp; Time</span><span className="pd-detail-value">{formatDateTime(pass.dateTime)}</span></div>
          </div>
          <div className="pd-detail-row">
            <div className="pd-detail-icon pd-detail-icon--orange">📍</div>
            <div className="pd-detail-body"><span className="pd-detail-label">Venue</span><span className="pd-detail-value">{formatLocation(pass.venue)}</span></div>
          </div>
        </div>
      </div>
      {pass.description && <div className="pd-card"><h2 className="pd-section-title">Description</h2><p className="pd-desc-text">{pass.description}</p></div>}
      {isOwner && (
        <div className="pd-card">
          <h2 className="pd-section-title">Manage Listing</h2>
          <div className="pd-owner-bar">
            <button className="pd-owner-btn pd-owner-btn--edit" onClick={()=>setShowEdit(true)}>✏️ Edit Pass</button>
            {pass.status!=='sold' && <button className="pd-owner-btn pd-owner-btn--sold" onClick={()=>setShowSold(true)}>🏷️ Mark as Sold</button>}
            <button className="pd-owner-btn pd-owner-btn--delete" onClick={()=>setShowDelete(true)}>🗑️ Delete</button>
          </div>
        </div>
      )}
      <SellerCard seller={pass.user} createdAt={pass.createdAt} isOwner={isOwner} isSold={pass.status==='sold'} onChat={onChat} />
      {showEdit && <EditPassPanel pass={pass} onClose={()=>setShowEdit(false)} onSaved={u=>{setPass(u);setShowEdit(false)}} />}
      {showDelete && <DeleteConfirm onCancel={()=>setShowDelete(false)} onConfirm={handleDelete} loading={deleting} />}
      {showSold && <SoldConfirm onCancel={()=>setShowSold(false)} onConfirm={handleSold} loading={marking} />}
    </>
  )
}

/* ---- Travel Ticket ---------------------------------------- */
function TravelTicketDetail({ ticket, setTicket, isOwner, onChat }: {
  ticket: TravelTicket; setTicket: (t: TravelTicket) => void; isOwner: boolean; onChat: () => void
}) {
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const typeIcon = getTicketIcon(ticket.ticketType)

  async function handleDelete() {
    setDeleting(true)
    try { await api.delete(`/tickets/${ticket._id}`); toast.success('Ticket deleted'); navigate('/home') }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false); setShowDelete(false) }
  }

  return (
    <>
      {/* Boarding pass hero */}
      <div className="pd-ticket-hero">
        <div className="pd-ticket-hero__header">
          <div className="pd-ticket-hero__type">
            <div className="pd-ticket-hero__type-icon">{typeIcon}</div>
            <div>
              <div className="pd-ticket-hero__type-label">{ticket.ticketType} Ticket</div>
              <div className="pd-ticket-hero__route">{ticket.origin.city} → {ticket.destination.city}</div>
            </div>
          </div>
          <div className="pd-ticket-hero__price-block">
            <div className="pd-ticket-hero__price-label">Price</div>
            <div className="pd-ticket-hero__price">₹{ticket.price.toLocaleString()}</div>
          </div>
        </div>
        <div className="pd-ticket-hero__tear">
          <div className="pd-ticket-hero__tear-notch pd-ticket-hero__tear-notch--left" />
          <div className="pd-ticket-hero__tear-line" />
          <div className="pd-ticket-hero__tear-notch pd-ticket-hero__tear-notch--right" />
        </div>
        <div className="pd-ticket-hero__stub">
          <div className="pd-ticket-hero__stub-half">
            <div className="pd-ticket-hero__stub-dir">FROM</div>
            <div className="pd-ticket-hero__stub-city">{ticket.origin.city}</div>
            <div className="pd-ticket-hero__stub-station">{ticket.origin.area}</div>
            <div className="pd-ticket-hero__stub-time">{formatTime(ticket.departureTime)}</div>
            <div className="pd-ticket-hero__stub-date">{formatDate(ticket.departureTime)}</div>
          </div>
          <div className="pd-ticket-hero__stub-divider"><div className="pd-ticket-hero__stub-icon">{typeIcon}</div></div>
          <div className="pd-ticket-hero__stub-half pd-ticket-hero__stub-half--right">
            <div className="pd-ticket-hero__stub-dir">TO</div>
            <div className="pd-ticket-hero__stub-city">{ticket.destination.city}</div>
            <div className="pd-ticket-hero__stub-station">{ticket.destination.area}</div>
            <div className="pd-ticket-hero__stub-time">{formatTime(ticket.arrivalTime)}</div>
            <div className="pd-ticket-hero__stub-date">{formatDate(ticket.arrivalTime)}</div>
          </div>
        </div>
      </div>

      <div className="pd-card">
        <div className="pd-info__pricing">
          <span className="pd-price">₹{ticket.price.toLocaleString()}</span>
          {ticket.isNegotiable && <span className="pd-negotiable-badge">Negotiable</span>}
          <span className="pd-chip">{ticket.quantity} seat{ticket.quantity!==1?'s':''}</span>
        </div>
      </div>

      <div className="pd-card">
        <h2 className="pd-section-title">Journey Details</h2>
        <div className="pd-details-list">
          {[
            { icon:'📍', label:'From', value:formatLocation(ticket.origin), orange:true },
            { icon:'📍', label:'To', value:formatLocation(ticket.destination), orange:true },
            { icon:'🕐', label:'Departure', value:formatDateTime(ticket.departureTime) },
            { icon:'🕐', label:'Arrival', value:formatDateTime(ticket.arrivalTime) },
          ].map(r=>(
            <div key={r.label} className="pd-detail-row">
              <div className={`pd-detail-icon ${r.orange?'pd-detail-icon--orange':''}`}>{r.icon}</div>
              <div className="pd-detail-body"><span className="pd-detail-label">{r.label}</span><span className="pd-detail-value">{r.value}</span></div>
            </div>
          ))}
        </div>
      </div>

      {ticket.description && <div className="pd-card"><h2 className="pd-section-title">Description</h2><p className="pd-desc-text">{ticket.description}</p></div>}

      {isOwner && (
        <div className="pd-card">
          <h2 className="pd-section-title">Manage Listing</h2>
          <div className="pd-owner-bar">
            <button className="pd-owner-btn pd-owner-btn--edit" onClick={()=>setShowEdit(true)}>✏️ Edit Ticket</button>
            <button className="pd-owner-btn pd-owner-btn--delete" onClick={()=>setShowDelete(true)}>🗑️ Delete</button>
          </div>
        </div>
      )}

      <SellerCard seller={ticket.user} createdAt={ticket.createdAt} isOwner={isOwner} onChat={onChat} />
      {showEdit && <EditTicketPanel ticket={ticket} onClose={()=>setShowEdit(false)} onSaved={u=>{setTicket(u);setShowEdit(false)}} />}
      {showDelete && <DeleteConfirm onCancel={()=>setShowDelete(false)} onConfirm={handleDelete} loading={deleting} />}
    </>
  )
}

/* ============================================================
   Main Page
   ============================================================ */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selected, setSelected] = useState(
    () => sessionStorage.getItem('home_tab') || 'Buy & Sell'
  )
  const [catsOpen, setCatsOpen] = useState(false)

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
    setLoading(true); setError(null)
    setSellProduct(null); setFoundItem(null); setEventPass(null); setTravelTicket(null)

    const endpoint =
      type === 'sell'   ? `/sell-products/${id}` :
      type === 'found'  ? `/found-products/${id}` :
      type === 'pass'   ? `/passes/${id}` :
      type === 'ticket' ? `/tickets/${id}` :
                          `/feed/details/${id}?type=${type}`

    api.get(endpoint)
      .then(res => {
        if (!res.data.success) { setError('Item not found'); return }
        const d = res.data.data
        if (type === 'sell')   setSellProduct(d)
        else if (type === 'found')  setFoundItem(d)
        else if (type === 'pass')   setEventPass(d)
        else if (type === 'ticket') setTravelTicket(d)
      })
      .catch(() => setError('Failed to load item. Please try again.'))
      .finally(() => setLoading(false))
  }, [id, type])

  const currentItem = sellProduct || foundItem || eventPass || travelTicket
  const itemUserId = currentItem ? String((currentItem.user as Seller)?._id || currentItem.user) : ''
  const isOwner = !!(user && itemUserId && sameId(itemUserId, user._id))

  const breadcrumbMeta = {
    sell:   { label:'For Sale',      icon:'🛍️' },
    found:  { label:'Found Item',    icon:'🏷️' },
    pass:   { label:'Event Pass',    icon:'🎵' },
    ticket: { label:'Travel Ticket', icon:'🎫' },
  }[type] || { label:'Listing', icon:'📋' }

  const itemName = currentItem
    ? (currentItem as any).name
      || `${(currentItem as TravelTicket).origin?.city} → ${(currentItem as TravelTicket).destination?.city}`
      || 'Item'
    : 'Item'
  const itemSeller = currentItem ? currentItem.user as Seller : null
  const itemStatus = (currentItem as any)?.status
  const itemImage = (currentItem as any)?.images?.[0]?.url || (currentItem as any)?.imageUrl || ''

  return (
    <div className="pd-root">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} selected={selected}
        handleNav={s => { navigate(-1) }}
        handleHelp={() => navigate('/help')}
        handleLogout={() => navigate('/signin')} />

      <div className="pd-main">
        <Topbar catsOpen={catsOpen} setCatsOpen={setCatsOpen}
          categories={[]} selectedCategory="" setSelectedCategory={() => {}}
          maxPrice={0} setMaxPrice={() => {}}
          handleAddItem={() => navigate('/add-item')}
          handleNotif={() => navigate('/notifications')}
          handleProfile={() => navigate('/profile')}
          userAvatar={user?.avatar} />

        <div className="pd-content">
          {loading ? (
            <div className="pd-loading"><div className="pd-spinner" /><span>Loading…</span></div>
          ) : error || !currentItem ? (
            <div className="pd-error-state">
              <div className="pd-error-state__icon">😕</div>
              <div className="pd-error-state__title">Item Not Found</div>
              <p>{error || 'This item does not exist.'}</p>
              <button className="pd-error-state__back" onClick={() => navigate(-1)}>← Go Back</button>
            </div>
          ) : (
            <div className="pd-container">
              <div className="pd-breadcrumb">
                <button className="pd-breadcrumb__back" onClick={() => navigate(-1)}>← Back</button>
                <span className="pd-breadcrumb__sep">/</span>
                <span className="pd-breadcrumb__tag">{breadcrumbMeta.icon} {breadcrumbMeta.label}</span>
              </div>

              <div className="pd-status-row">
                <span className="pd-badge pd-badge--type">{breadcrumbMeta.icon} {breadcrumbMeta.label}</span>
                {itemStatus && (
                  <span className={`pd-badge ${itemStatus==='sold'||itemStatus==='closed'?'pd-badge--sold':'pd-badge--active'}`}>
                    {itemStatus==='sold'||itemStatus==='closed' ? (type==='found'?'● Returned':'● Sold') : '● Active'}
                  </span>
                )}
                {/* Found items show "Pending" when active */}
                {type==='found' && (!itemStatus || itemStatus==='active') && (
                  <span className="pd-badge pd-badge--pending">● Pending</span>
                )}
              </div>

              {type === 'sell'   && sellProduct   && <SellProductDetail product={sellProduct}  setProduct={setSellProduct}  isOwner={isOwner} onChat={() => setShowChat(true)} />}
              {type === 'found'  && foundItem      && <FoundItemDetail   item={foundItem}       setItem={setFoundItem}        isOwner={isOwner} onChat={() => setShowChat(true)} />}
              {type === 'pass'   && eventPass      && <EventPassDetail   pass={eventPass}       setPass={setEventPass}        isOwner={isOwner} onChat={() => setShowChat(true)} />}
              {type === 'ticket' && travelTicket   && <TravelTicketDetail ticket={travelTicket} setTicket={setTravelTicket}   isOwner={isOwner} onChat={() => setShowChat(true)} />}
            </div>
          )}
        </div>
      </div>

      {showChat && itemSeller && (
        <ChatModal 
          seller={itemSeller} 
          productName={itemName} 
          isFound={type==='found'}
          itemId={id}
          itemType={type}
          itemImage={itemImage}
          onClose={() => setShowChat(false)} 
        />
      )}
    </div>
  )
}
