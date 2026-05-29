'use client'

import { useState, useEffect, useCallback } from 'react'

type Client = { id: number; name: string; phone?: string; _count?: { absences: number } }
type Booking = {
  id: number; clientId: number; client: Client
  room: string; startTime: string; endTime: string
  status: string; notes?: string; batchId?: number; batch?: Batch
}
type BatchEnrolment = { id: number; clientId: number; client: Client }
type Faculty = { id: number; name: string; phone?: string; batches?: {id:number;name:string;color:string}[]; _count?: { attendance: number } }
type FacultyAttendanceRecord = { id:number; facultyId:number; bookingId:number; present:boolean; booking:{startTime:string;endTime:string;batchId?:number} }
type Batch = {
  id: number; name: string; room: string; startTime: string
  duration: number; repeatDays: string; startDate: string; endDate: string
  color: string; status: string; facultyId?: number; faculty?: Faculty
  enrolments: BatchEnrolment[]
  bookings: Booking[]
}

const ROOMS = [
  { value: 'dj_classroom', label: '🎧 DJ Classroom' },
  { value: 'control_room', label: '🎙️ Control Room' },
]
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DURATIONS = [1,2,3,4,5,6]
const BATCH_COLORS = ['#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6','#F97316','#84CC16']

function fmtDate(d: Date) {
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .split('T')[0]
}
function fmtTime12(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}
function getDur(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 3600000)
}
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()
}
const AV_COLORS = ['#6C3CE1','#06D6A0','#F59E0B','#EF4444','#3B82F6']
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h<<5)-h)
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}
function roomBadge(room: string) {
  if (room === 'dj_classroom') return { label:'🎧 DJ Classroom', bg:'rgba(108,60,225,0.15)', color:'#A78BFA' }
  return { label:'🎙️ Control Room', bg:'rgba(6,214,160,0.15)', color:'#34D399' }
}
function fmtDateLabel(dateStr: string) {
  const today = fmtDate(new Date())
  if (dateStr === today) return 'Today'
  const tom = new Date(); tom.setDate(tom.getDate()+1)
  if (dateStr === fmtDate(tom)) return 'Tomorrow'
  return new Date(dateStr+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
}

const S: Record<string,React.CSSProperties> = {
  app: { maxWidth:480, margin:'0 auto', minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", background:'#0F0F14', color:'#F5F5F7' },
  header: { background:'linear-gradient(135deg,#5B21B6 0%,#6C3CE1 50%,#8B5CF6 100%)', padding:'16px 20px 24px', borderRadius:'0 0 24px 24px', position:'sticky', top:0, zIndex:50, boxShadow:'0 8px 32px rgba(108,60,225,0.3)' },
  page: { padding:'20px', paddingBottom:100 },
  tabBar: { position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'min(100%, 480px)', maxWidth:480, background:'rgba(26,26,36,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid #2A2A3D', display:'flex', justifyContent:'space-around', padding:'8px 4px 16px', zIndex:100 },
  card: { background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:16, padding:16, marginBottom:12 },
  input: { width:'100%', background:'#242436', border:'1px solid #2A2A3D', borderRadius:12, padding:'14px 16px', color:'#F5F5F7', fontSize:15, fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, WebkitAppearance:'none' as const },
  label: { display:'block', fontSize:13, fontWeight:600, color:'#9CA3AF', marginBottom:8 } as React.CSSProperties,
  btnPrimary: { background:'linear-gradient(135deg,#6C3CE1 0%,#8B5CF6 100%)', color:'white', border:'none', padding:'14px 24px', borderRadius:14, fontWeight:600, fontSize:15, cursor:'pointer', width:'100%', boxShadow:'0 4px 16px rgba(108,60,225,0.4)' },
  btnDanger: { background:'rgba(239,68,68,0.15)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.3)', padding:'14px', borderRadius:14, fontSize:14, fontWeight:600, cursor:'pointer', width:'100%' },
}

export default function App() {
  const [tab, setTab] = useState<'dashboard'|'calendar'|'batches'|'students'|'faculty'>('dashboard')
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(() => fmtDate(new Date()))
  const [searchQ, setSearchQ] = useState('')
  const [roomFilter, setRoomFilter] = useState('all')
  const [showPastBookings, setShowPastBookings] = useState(false)
  const [absenceModal, setAbsenceModal] = useState<Client|null>(null)
  const [absences, setAbsences] = useState<{id:number;clientId:number;bookingId:number;booking:{startTime:string;endTime:string;batchId?:number}}[]>([])
  const [absenceLoading, setAbsenceLoading] = useState(false)
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [facultyAttendanceModal, setFacultyAttendanceModal] = useState<Faculty|null>(null)
  const [facultyAttendance, setFacultyAttendance] = useState<FacultyAttendanceRecord[]>([])
  const [editingFacultyId, setEditingFacultyId] = useState<number|null>(null)
  const [editFacultyName, setEditFacultyName] = useState('')
  const [editFacultyPhone, setEditFacultyPhone] = useState('')
  const [showNewFaculty, setShowNewFaculty] = useState(false)
  const [newFacultyName, setNewFacultyName] = useState('')
  const [newFacultyPhone, setNewFacultyPhone] = useState('')
  const [facultyListSearch, setFacultyListSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => new Date().getFullYear())

  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editBooking, setEditBooking] = useState<Booking|null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [bookingForm, setBookingForm] = useState({ clientId:'', room:'dj_classroom', type:'demo', date:fmtDate(new Date()), startTime:'10:00', duration:'2', notes:'' })

  // Batch modal
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchForm, setBatchForm] = useState({ name:'', room:'dj_classroom', dayPair:'' as ''|'tue-thu'|'wed-fri'|'sat-sun', timeSlot:'' as ''|'10:00'|'12:00'|'14:00'|'16:00'|'18:00'|'20:00', startDate:fmtDate(new Date()), clientIds:[] as number[], facultyId:'' })
  const [batchClientSearch, setBatchClientSearch] = useState('')
  const [batchClients, setBatchClients] = useState<Client[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch|null>(null)
  const [addStudentSearch, setAddStudentSearch] = useState('')
  const [addStudentResults, setAddStudentResults] = useState<Client[]>([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showChangeFaculty, setShowChangeFaculty] = useState(false)

  // Shared
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(''); const [toastOn, setToastOn] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showNewClientDirect, setShowNewClientDirect] = useState(false)
  const [directClientName, setDirectClientName] = useState('')
  const [directClientPhone, setDirectClientPhone] = useState('')
  const [allClients, setAllClients] = useState<Client[]>([])
  const [clientListSearch, setClientListSearch] = useState('')
  const [editingClientId, setEditingClientId] = useState<number|null>(null)
  const [editClientName, setEditClientName] = useState('')
  const [editClientPhone, setEditClientPhone] = useState('')

  const showToast = (msg: string) => { setToast(msg); setToastOn(true); setTimeout(() => setToastOn(false), 2500) }

  const loadBookings = useCallback(async () => {
    const res = await fetch('/api/bookings')
    if (res.ok) setAllBookings(await res.json())
  }, [])
  const loadFaculties = useCallback(async () => {
    const res = await fetch('/api/faculty')
    if (res.ok) setFaculties(await res.json())
  }, [])
  const loadFacultyAttendance = useCallback(async (facultyId: number) => {
    const res = await fetch('/api/faculty-attendance?facultyId=' + facultyId)
    if (res.ok) setFacultyAttendance(await res.json())
  }, [])
  const loadAllClients = useCallback(async () => {
    const res = await fetch('/api/clients?q=&t=' + Date.now())
    if (res.ok) setAllClients(await res.json())
  }, [])
  const loadAbsences = useCallback(async (clientId: number) => {
    setAbsenceLoading(true)
    const res = await fetch('/api/absences?clientId=' + clientId)
    if (res.ok) setAbsences(await res.json())
    setAbsenceLoading(false)
  }, [])
  const loadBatches = useCallback(async () => {
    const res = await fetch('/api/batches')
    if (res.ok) setBatches(await res.json())
  }, [])

  useEffect(() => { loadBookings(); loadBatches(); loadAllClients(); loadFaculties() }, [loadBookings, loadBatches, loadAllClients, loadFaculties])

  useEffect(() => {
    if (!showBookingModal) return
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(clientSearch)}`)
      if (res.ok) setClients(await res.json())
    }, 200)
    return () => clearTimeout(t)
  }, [clientSearch, showBookingModal])

  useEffect(() => {
    if (!showBatchModal) return
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(batchClientSearch)}`)
      if (res.ok) setBatchClients(await res.json())
    }, 200)
    return () => clearTimeout(t)
  }, [batchClientSearch, showBatchModal])

  // Stats
  const now = new Date()
  const _sm = new Date(now); _sm.setHours(0,0,0,0)
  const _em = new Date(_sm); _em.setDate(_em.getDate()+1)
  const sow = new Date(_sm); sow.setDate(_sm.getDate()-_sm.getDay())
  const eow = new Date(sow); eow.setDate(sow.getDate()+7)
  const som = new Date(now.getFullYear(), now.getMonth(), 1)
  const eom = new Date(now.getFullYear(), now.getMonth()+1, 1)
  const statToday = allBookings.filter(b => { const d=new Date(b.startTime); return d>=_sm&&d<_em }).length
  const statWeek = allBookings.filter(b => { const d=new Date(b.startTime); return d>=sow&&d<eow }).length
  const statMonth = allBookings.filter(b => { const d=new Date(b.startTime); return d>=som&&d<eom }).length
  const _todayMidnight = new Date(); _todayMidnight.setHours(0,0,0,0)
  const _tomorrowMidnight = new Date(_todayMidnight); _tomorrowMidnight.setDate(_tomorrowMidnight.getDate()+1)
  const todayBookings = allBookings.filter(b => { const d=new Date(b.startTime); return d>=_todayMidnight&&d<_tomorrowMidnight }).sort((a,b)=>a.startTime.localeCompare(b.startTime))
  const upcoming = allBookings.filter(b => new Date(b.startTime)>=_tomorrowMidnight).sort((a,b)=>a.startTime.localeCompare(b.startTime)).slice(0,6)

  function getBookingsForDate(dateStr: string) {
    return allBookings.filter(b => fmtDate(new Date(b.startTime))===dateStr).sort((a,b)=>a.startTime.localeCompare(b.startTime))
  }

  function bookingColor(b: Booking) {
    if (b.batchId && b.batch) return b.batch.color
    return b.room==='dj_classroom' ? '#8B5CF6' : '#06D6A0'
  }

  // Booking modal handlers
  function openNew() {
    setEditBooking(null)
    setBookingForm({ clientId:'', room:'dj_classroom', type:'demo', date:selectedDate||fmtDate(new Date()), startTime:'10:00', duration:'2', notes:'' })
    setClientSearch(''); setFormError(''); setShowNewClient(false); setShowAddMenu(false); setShowBookingModal(true)
  }
  function openEdit(b: Booking) {
    setEditBooking(b)
    const d=new Date(b.startTime), pad=(n:number)=>String(n).padStart(2,'0')
    setBookingForm({ clientId:String(b.clientId), room:b.room, type:(b as any).sessionType||'demo', date:fmtDate(d), startTime:`${pad(d.getHours())}:${pad(d.getMinutes())}`, duration:String(getDur(b.startTime,b.endTime)), notes:b.notes??'' })
    setClientSearch(b.client.name); setFormError(''); setShowBookingModal(true)
  }
  async function handleBookingSubmit() {
    if (!bookingForm.clientId||!bookingForm.date||!bookingForm.startTime) { setFormError('Please fill in required fields'); return }
    setLoading(true); setFormError('')
    const start = new Date(`${bookingForm.date}T${bookingForm.startTime}:00`)
    const end = new Date(start); end.setHours(end.getHours()+Number(bookingForm.duration))
    const body = { clientId:Number(bookingForm.clientId), room:bookingForm.room, startTime:start.toISOString(), endTime:end.toISOString(), notes:bookingForm.notes, sessionType: bookingForm.type }
    const url = editBooking ? `/api/bookings/${editBooking.id}` : '/api/bookings'
    const res = await fetch(url, { method:editBooking?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    const data = await res.json(); setLoading(false)
    if (!res.ok) { setFormError(data.error); return }
    setShowBookingModal(false); loadBookings(); showToast(editBooking?'Booking updated!':'Booking created!')
  }
  async function handleBookingDelete(id: number) {
    if (!confirm('Cancel this booking?')) return
    await fetch(`/api/bookings/${id}`, { method:'DELETE' })
    loadBookings(); showToast('Booking cancelled'); setShowBookingModal(false)
  }
  async function handleNewClient() {
    if (!newClientName.trim()) return
    const res = await fetch('/api/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:newClientName.trim(), phone:newClientPhone.trim() }) })
    const c = await res.json()
    setBookingForm(f=>({...f,clientId:String(c.id)})); setClientSearch(c.name)
    setShowNewClient(false); setNewClientName(''); setNewClientPhone('')
  }

  // Batch modal handlers
  function openBatchModal() {
    setBatchForm({ name:'', room:'dj_classroom', dayPair:'', timeSlot:'', startDate:fmtDate(new Date()), clientIds:[], facultyId:'' })
    setBatchClientSearch(''); setFormError(''); setShowAddMenu(false); setShowBatchModal(true)
  }
  function autoName(dayPair: string, batchCount: number) {
    const type = dayPair === 'sat-sun' ? 'Weekend' : 'Weekday'
    return 'DJ ' + type + ' Batch ' + (batchCount + 1)
  }
  function getDayPairDays(dp: string): number[] {
    if (dp === 'tue-thu') return [2, 4]
    if (dp === 'wed-fri') return [3, 5]
    if (dp === 'sat-sun') return [6, 0]
    return []
  }
  function getTimeLabel(t: string) {
    const map: Record<string,string> = {'10:00':'10am – 12pm','12:00':'12pm – 2pm','14:00':'2pm – 4pm','16:00':'4pm – 6pm','18:00':'6pm – 8pm','20:00':'8pm – 10pm'}
    return map[t] || t
  }

  function toggleBatchClient(id: number) {
    setBatchForm(f => {
      if (f.clientIds.includes(id)) return { ...f, clientIds: f.clientIds.filter(c=>c!==id) }
      if (f.clientIds.length >= 4) return f
      return { ...f, clientIds: [...f.clientIds, id] }
    })
  }
  async function handleBatchSubmit() {
    if (!batchForm.dayPair) { setFormError('Select a day pair'); return }
    if (!batchForm.timeSlot) { setFormError('Select a time slot'); return }
    if (!batchForm.startDate) { setFormError('Select a start date'); return }
    if (batchForm.clientIds.length===0) { setFormError('Add at least one student'); return }
    // Validate start date falls on one of the selected days
    const startDay = new Date(batchForm.startDate + 'T00:00:00').getDay()
    const days = getDayPairDays(batchForm.dayPair)
    if (!days.includes(startDay)) {
      const dayNames: Record<number,string> = {0:'Sunday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday',6:'Saturday'}
      setFormError('Start date must be a ' + days.map(d=>dayNames[d]).join(' or '))
      return
    }
    setLoading(true); setFormError('')
    const batchCount = batches.length
    const name = batchForm.name || autoName(batchForm.dayPair, batchCount)
    const body = {
      name,
      room: batchForm.room,
      startTime: batchForm.timeSlot,
      duration: 2,
      repeatDays: days.join(','),
      startDate: batchForm.startDate,
      endDate: '',
      clientIds: batchForm.clientIds,
      totalSessions: 16,
      facultyId: batchForm.facultyId ? Number(batchForm.facultyId) : undefined,
    }
    const res = await fetch('/api/batches', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    const data = await res.json(); setLoading(false)
    if (!res.ok) { setFormError(data.error); return }
    setShowBatchModal(false); loadBookings(); loadBatches()
    showToast('Batch created! 16 sessions booked.')
  }
  async function handleCancelBatch(id: number) {
    if (!confirm('Delete this batch and ALL its sessions? This cannot be undone.')) return
    await fetch(`/api/batches/${id}`, { method:'DELETE' })
    loadBookings(); loadBatches(); setSelectedBatch(null); showToast('Batch deleted')
  }

  // Calendar
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const firstDay = new Date(calYear,calMonth,1).getDay()
  const daysInMonth = new Date(calYear,calMonth+1,0).getDate()
  const prevDays = new Date(calYear,calMonth,0).getDate()
  const calDays: { day:number; dateStr:string; isCurrentMonth:boolean }[] = []
  for (let i=firstDay-1;i>=0;i--) calDays.push({day:prevDays-i,dateStr:'',isCurrentMonth:false})
  for (let d=1;d<=daysInMonth;d++) {
    const dateStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    calDays.push({day:d,dateStr,isCurrentMonth:true})
  }
  const remaining=(7-calDays.length%7)%7
  for (let i=1;i<=remaining;i++) calDays.push({day:i,dateStr:'',isCurrentMonth:false})

  const allFiltered = allBookings
    .filter(b => roomFilter==='all'||b.room===roomFilter)
    .filter(b => !searchQ||b.client.name.toLowerCase().includes(searchQ.toLowerCase()))
  const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0)
  const upcomingBookings = allFiltered
    .filter(b => new Date(b.startTime) >= todayMidnight)
    .sort((a,b)=>a.startTime.localeCompare(b.startTime))
  const pastBookings = allFiltered
    .filter(b => new Date(b.startTime) < todayMidnight)
    .sort((a,b)=>b.startTime.localeCompare(a.startTime))
  const filteredBookings = showPastBookings ? pastBookings : upcomingBookings
const groupedBookings = filteredBookings.reduce((acc, booking) => {
  const dateKey = fmtDate(new Date(booking.startTime))

  if (!acc[dateKey]) {
    acc[dateKey] = []
  }

  acc[dateKey].push(booking)

  return acc
}, {} as Record<string, Booking[]>)

  function DatePickerInput({ value, onChange, room }: { value:string; onChange:(d:string)=>void; room:string }) {
    const [open, setOpen] = useState(false)
    const [pickerMonth, setPickerMonth] = useState(() => value ? new Date(value+'T00:00:00').getMonth() : new Date().getMonth())
    const [pickerYear, setPickerYear] = useState(() => value ? new Date(value+'T00:00:00').getFullYear() : new Date().getFullYear())
    const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa']
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const firstDay = new Date(pickerYear, pickerMonth, 1).getDay()
    const daysInMonth = new Date(pickerYear, pickerMonth+1, 0).getDate()
    const prevDays = new Date(pickerYear, pickerMonth, 0).getDate()
    const cells: {day:number;dateStr:string;cur:boolean}[] = []
    for(let i=firstDay-1;i>=0;i--) cells.push({day:prevDays-i,dateStr:'',cur:false})
    for(let d=1;d<=daysInMonth;d++){
      const dateStr=`${pickerYear}-${String(pickerMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({day:d,dateStr,cur:true})
    }
    const rem=(7-cells.length%7)%7
    for(let i=1;i<=rem;i++) cells.push({day:i,dateStr:'',cur:false})

    // Find booked slots per date for this room
    const TIME_SLOTS = ['10:00','12:00','14:00','16:00','18:00','20:00']
    const roomBookings = allBookings.filter(b => b.room===room && b.status!=='cancelled')
    
    // For each date, check how many of the 6 standard slots are taken
    const getBookedSlots = (dateStr: string) => {
      return TIME_SLOTS.filter(slot => {
        const [h,m] = slot.split(':').map(Number)
        const slotStart = new Date(dateStr + 'T00:00:00')
        slotStart.setHours(h, m, 0, 0)
        const slotEnd = new Date(slotStart)
        slotEnd.setHours(slotEnd.getHours() + 2)
        return roomBookings.some(b => {
          const bs = new Date(b.startTime), be = new Date(b.endTime)
          return bs < slotEnd && be > slotStart
        })
      }).length
    }
    const todayStr = fmtDate(new Date())

    const displayValue = value
      ? new Date(value+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})
      : 'Select date'

    return (
      <div style={{ position:'relative' }}>
        <button type="button" onClick={()=>setOpen(v=>!v)} style={{ ...S.input, textAlign:'left', cursor:'pointer', color: value?'#F5F5F7':'#6B7280', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>{displayValue}</span>
          <span style={{ color:'#6B7280' }}>📅</span>
        </button>
        {open && (
          <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:16, padding:16, zIndex:300, boxShadow:'0 16px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <button type="button" onClick={()=>{ let m=pickerMonth-1,y=pickerYear; if(m<0){m=11;y--} setPickerMonth(m);setPickerYear(y) }} style={{ background:'#242436', border:'none', borderRadius:8, padding:'6px 10px', color:'white', cursor:'pointer' }}>‹</button>
              <span style={{ fontSize:14, fontWeight:600 }}>{monthNames[pickerMonth]} {pickerYear}</span>
              <button type="button" onClick={()=>{ let m=pickerMonth+1,y=pickerYear; if(m>11){m=0;y++} setPickerMonth(m);setPickerYear(y) }} style={{ background:'#242436', border:'none', borderRadius:8, padding:'6px 10px', color:'white', cursor:'pointer' }}>›</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#6B7280', padding:'4px 0' }}>{d}</div>)}
              {cells.map((cell,i)=>{
                const bookedSlots = cell.cur ? getBookedSlots(cell.dateStr) : 0
                const isFullyBooked = cell.cur && bookedSlots >= 6
                const isPartiallyBooked = cell.cur && bookedSlots > 0 && bookedSlots < 6
                const isPast = cell.cur && cell.dateStr < todayStr
                const isSelected = cell.dateStr===value
                const isToday = cell.dateStr===todayStr
                return (
                  <button type="button" key={i}
                    onClick={()=>{ if(!cell.cur || isFullyBooked) return; onChange(cell.dateStr); setOpen(false) }}
                    style={{
                      aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                      borderRadius:8, fontSize:13, fontWeight:isToday?700:500,
                      border:'none', cursor: !cell.cur||isFullyBooked ? 'default' : 'pointer',
                      background: isSelected?'#6C3CE1' : isFullyBooked?'rgba(239,68,68,0.1)' : 'transparent',
                      color: !cell.cur?'#2A2A3D' : isSelected?'white' : isFullyBooked?'#4B3030' : isPast?'#4B5563' : isToday?'#8B5CF6' : '#F5F5F7',
                      position:'relative',
                      textDecoration: isFullyBooked&&!isSelected ? 'line-through' : 'none',
                      opacity: !cell.cur ? 0 : 1,
                    }}>
                    {cell.day}
                    {isPartiallyBooked&&!isSelected&&(
                      <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', display:'flex', gap:1 }}>
                        {Array.from({length:bookedSlots}).map((_,i)=>(
                          <div key={i} style={{ width:3, height:3, background:'#F59E0B', borderRadius:'50%' }} />
                        ))}
                      </div>
                    )}
                    {isFullyBooked&&!isSelected&&(
                      <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, background:'#EF4444', borderRadius:'50%' }} />
                    )}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:8, fontSize:11, color:'#6B7280' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:8, height:8, background:'#F59E0B', borderRadius:'50%' }} />Partially booked</div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:8, height:8, background:'rgba(239,68,68,0.3)', borderRadius:2 }} />Fully booked</div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:8, height:8, background:'#6C3CE1', borderRadius:2 }} />Selected</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function BookingCard({ b, onClick }: { b:Booking; onClick?:()=>void }) {
    const badge = roomBadge(b.room)
    const dur = getDur(b.startTime,b.endTime)
    const leftColor = bookingColor(b)
      const _bStart = new Date(b.startTime)
      const _todayM = new Date(); _todayM.setHours(0,0,0,0)
      const _tomorrowM = new Date(_todayM); _tomorrowM.setDate(_tomorrowM.getDate()+1)
      const isBookingToday = _bStart >= _todayM && _bStart < _tomorrowM
    return (
      <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:14, background: isBookingToday ? 'rgba(108,60,225,0.12)' : '#1A1A24', border: isBookingToday ? '1.5px solid rgba(108,60,225,0.5)' : '1px solid #2A2A3D', borderRadius:14, marginBottom:10, position:'relative', overflow:'hidden', cursor:onClick?'pointer':'default' }}>
      {isBookingToday && <div style={{ position:'absolute', top:8, right:onClick?28:10, fontSize:10, fontWeight:700, color:'#8B5CF6', background:'rgba(108,60,225,0.2)', padding:'2px 6px', borderRadius:6 }}>TODAY</div>}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:leftColor, borderRadius:'0 4px 4px 0' }} />
        <div style={{ background:'#242436', padding:'6px 8px', borderRadius:10, fontSize:12, fontWeight:600, textAlign:'center', minWidth:68, lineHeight:1.5, flexShrink:0 }}>
          <div style={{ color:'#9CA3AF', fontSize:10 }}>{new Date(b.startTime).toLocaleDateString('en-IN',{weekday:'short'})}</div>
          <div style={{ color:'#9CA3AF', fontSize:10 }}>{new Date(b.startTime).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
          <div>{fmtTime12(b.startTime)}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {b.batch ? (
            <div style={{ marginBottom:4 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.batch.name}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                {b.batch.enrolments?.map(e=>(
                  <div key={e.id} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:24, height:24, borderRadius:6, background:avatarColor(e.client.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, color:'white' }}>{getInitials(e.client.name)}</div>
                    <span style={{ fontSize:12, color:'#D1D5DB' }}>{e.client.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:avatarColor(b.client.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'white', flexShrink:0 }}>{getInitials(b.client.name)}</div>
              <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.client.name}</div>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:badge.bg, color:badge.color }}>{badge.label}</span>
            {(b as any).sessionType==='demo' && <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(99,102,241,0.15)', color:'#818CF8' }}>🎯 Demo</span>}
            {(b as any).sessionType==='practice' && <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(16,185,129,0.15)', color:'#34D399' }}>🎧 Practice</span>}
            {b.batch && <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:`${b.batch.color}22`, color:b.batch.color }}>📚 {b.batch.name}</span>}
          </div>
        </div>
        {onClick && <div style={{ color:'#6B7280', fontSize:18, flexShrink:0 }}>›</div>}
      </div>
    )
  }

  function EmptyState({ text }: { text:string }) {
    return <div style={{ textAlign:'center', padding:'40px 20px', color:'#4B5563' }}>
      <div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>📭</div>
      <div style={{ fontSize:13 }}>{text}</div>
    </div>
  }

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'white' }}>Raw Music Studio</h1>
            <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.7)' }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}</p>
          </div>
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowAddMenu(v=>!v)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white', fontSize:24 }}>+</button>
            {showAddMenu && (
              <div style={{ position:'absolute', right:0, top:52, background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:14, overflow:'hidden', minWidth:200, zIndex:200 }}>
                <button onClick={openBatchModal} style={{ display:'block', width:'100%', padding:'14px 16px', background:'none', border:'none', color:'#F5F5F7', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left' }}>📚 New Batch</button>
                <div style={{ height:1, background:'#2A2A3D' }} />
                <button onClick={()=>{ openNew(); setBookingForm(f=>({...f,type:'demo'})) }} style={{ display:'block', width:'100%', padding:'14px 16px', background:'none', border:'none', color:'#F5F5F7', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left' }}>🎯 Demo Class</button>
                <div style={{ height:1, background:'#2A2A3D' }} />
                <button onClick={()=>{ openNew(); setBookingForm(f=>({...f,type:'practice'})) }} style={{ display:'block', width:'100%', padding:'14px 16px', background:'none', border:'none', color:'#F5F5F7', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left' }}>🎧 Practice Session</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard */}
      {tab==='dashboard' && (
        <div style={S.page}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:24 }}>
            {([['Today',statToday],['This Week',statWeek],['This Month',statMonth]] as const).map(([label,val])=>(
              <div key={label} style={{ background:'linear-gradient(135deg,#242436,#1A1A24)', border:'1px solid #2A2A3D', borderRadius:16, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:800, color:'#8B5CF6' }}>{val}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>Today's Schedule</h2>
            <span style={{ fontSize:13, color:'#6B7280' }}>{todayBookings.length} session{todayBookings.length!==1?'s':''}</span>
          </div>
          {todayBookings.length===0 ? <EmptyState text="No bookings today" /> : todayBookings.map(b=><BookingCard key={b.id} b={b} onClick={()=>openEdit(b)} />)}
          {upcoming.length>0 && <>
            <h2 style={{ margin:'24px 0 12px', fontSize:17, fontWeight:700 }}>Upcoming</h2>
            {upcoming.map(b=>(
              <BookingCard key={b.id} b={b} onClick={()=>openEdit(b)} />
            ))}
          </>}
        </div>
      )}

      {/* Booking Calendar */}
      {tab==='calendar' && (
        <div style={S.page}>
          {/* Month nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <button onClick={()=>{ let m=calMonth-1,y=calYear; if(m<0){m=11;y--} setCalMonth(m);setCalYear(y) }} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontSize:18 }}>‹</button>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>{monthNames[calMonth]} {calYear}</h2>
            <button onClick={()=>{ let m=calMonth+1,y=calYear; if(m>11){m=0;y++} setCalMonth(m);setCalYear(y) }} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontSize:18 }}>›</button>
          </div>

          {/* Calendar grid */}
          <div style={S.card}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {DAYS.map(d=><div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#9CA3AF', padding:'8px 0' }}>{d}</div>)}
              {calDays.map((cell,i)=>{
                const dayBookings = cell.isCurrentMonth ? getBookingsForDate(cell.dateStr) : []
                const isToday=cell.dateStr===fmtDate(new Date()), isSel=cell.dateStr===selectedDate
                return (
                  <button key={i} onClick={()=>cell.isCurrentMonth&&setSelectedDate(cell.dateStr)}
                    style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12, fontSize:14, fontWeight:isToday?700:500, cursor:cell.isCurrentMonth?'pointer':'default', position:'relative', background:isSel?'#6C3CE1':isToday?'rgba(108,60,225,0.2)':'transparent', border:'none', color:isSel?'white':isToday?'#8B5CF6':cell.isCurrentMonth?'#F5F5F7':'#4B5563' }}>
                    {cell.day}
                    {dayBookings.length>0 && (
                      <div style={{ position:'absolute', bottom:3, display:'flex', gap:2, justifyContent:'center' }}>
                        {dayBookings.slice(0,3).map((b,i)=>(
                          <div key={i} style={{ width:4, height:4, background: isSel ? 'rgba(255,255,255,0.8)' : bookingColor(b), borderRadius:'50%' }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected date bookings */}
          <div style={{ marginTop:20, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#F5F5F7' }}>{fmtDateLabel(selectedDate)}</h3>
              <span style={{ fontSize:13, color:'#6B7280' }}>{getBookingsForDate(selectedDate).length} booking{getBookingsForDate(selectedDate).length!==1?'s':''}</span>
            </div>
            {getBookingsForDate(selectedDate).length===0
              ? <div style={{ padding:'16px', background:'#1A1A24', border:'1px dashed #2A2A3D', borderRadius:12, textAlign:'center', fontSize:13, color:'#4B5563' }}>No bookings for this date</div>
              : getBookingsForDate(selectedDate).map(b=><BookingCard key={b.id} b={b} onClick={()=>openEdit(b)} />)
            }
          </div>

          <div style={{ height:1, background:'#2A2A3D', marginBottom:20 }} />

          {/* All bookings list */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>All Bookings</h3>
            </div>
            <div style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ color:'#9CA3AF' }}>🔍</span>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search student..." style={{ background:'transparent', border:'none', color:'#F5F5F7', fontSize:14, outline:'none', width:'100%', fontFamily:'inherit' }} />
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:12, paddingBottom:4 }}>
              {[['all','All'],['dj_classroom','DJ Classroom'],['control_room','Control Room']].map(([val,label])=>(
                <button key={val} onClick={()=>setRoomFilter(val)} style={{ padding:'8px 14px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', background:roomFilter===val?'#6C3CE1':'#242436', border:`1px solid ${roomFilter===val?'#6C3CE1':'#2A2A3D'}`, color:roomFilter===val?'white':'#9CA3AF' }}>{label}</button>
              ))}
            </div>
            <div style={{ display:'flex', background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:12, padding:4, marginBottom:16 }}>
              <button onClick={()=>setShowPastBookings(false)} style={{ flex:1, padding:'9px', borderRadius:9, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:!showPastBookings?'#6C3CE1':'transparent', color:!showPastBookings?'white':'#9CA3AF' }}>
                Upcoming ({upcomingBookings.length})
              </button>
              <button onClick={()=>setShowPastBookings(true)} style={{ flex:1, padding:'9px', borderRadius:9, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:showPastBookings?'#6C3CE1':'transparent', color:showPastBookings?'white':'#9CA3AF' }}>
                Past ({pastBookings.length})
              </button>
            </div>
{filteredBookings.length===0 ? (
  <EmptyState
    text={showPastBookings ? 'No past bookings' : 'No upcoming bookings'}
  />
) : (
  Object.entries(groupedBookings).map(([date, bookings]) => (
    <div
      key={date}
      style={{
        background:'#1A1A24',
        border:'1px solid #2A2A3D',
        borderRadius:16,
        padding:16,
        marginBottom:16
      }}
    >
      <div
        style={{
          display:'flex',
          justifyContent:'space-between',
          marginBottom:12
        }}
      >
        <strong>{date}</strong>
        <span>{bookings.length} bookings</span>
      </div>

      {bookings.map(b => (
        <BookingCard
          key={b.id}
          b={b}
          onClick={() => openEdit(b)}
        />
      ))}
    </div>
  ))
)}
          </div>
        </div>
      )}



      {/* Batches / Courses */}
      {tab==='batches' && (
        <div style={S.page}>
          {selectedBatch ? (
            <>
              <button onClick={()=>setSelectedBatch(null)} style={{ background:'none', border:'none', color:'#8B5CF6', fontSize:14, fontWeight:600, cursor:'pointer', padding:'0 0 16px', display:'flex', alignItems:'center', gap:4 }}>‹ All Batches</button>
              <div style={{ ...S.card, borderLeft:`4px solid ${selectedBatch.color}` }}>
                <h2 style={{ margin:'0 0 4px', fontSize:18, fontWeight:700 }}>{selectedBatch.name}</h2>
                <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:8 }}>{roomBadge(selectedBatch.room).label} · {(() => { const [h,m]=selectedBatch.startTime.split(':').map(Number); const ampm=h>=12?'PM':'AM'; const h12=h%12||12; return h12+':'+(m<10?'0'+m:m)+' '+ampm })() } · {selectedBatch.duration}h</div>
                <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:8 }}>
                  {selectedBatch.repeatDays.split(',').map(d=>DAYS[Number(d)]).join(', ')} · {selectedBatch.startDate} → {selectedBatch.endDate}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px', background:'#242436', borderRadius:10 }}>
                  <span style={{ fontSize:13, flex:1, color:selectedBatch.faculty?'#A78BFA':'#6B7280' }}>Faculty: {selectedBatch.faculty ? selectedBatch.faculty.name : 'No faculty assigned'}</span>
                  <button onClick={()=>setShowChangeFaculty(v=>!v)} style={{ background:'rgba(108,60,225,0.15)', border:'1px solid rgba(108,60,225,0.3)', color:'#8B5CF6', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>{showChangeFaculty ? 'Cancel' : 'Change'}</button>
                </div>
                {showChangeFaculty && (
                  <div style={{ marginBottom:12 }}>
                    <select defaultValue={selectedBatch.facultyId||''} onChange={async e=>{ const res=await fetch('/api/batches/'+selectedBatch.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({facultyId:e.target.value||null})}); const data=await res.json(); if(res.ok){ setSelectedBatch(data); loadBatches(); setShowChangeFaculty(false); showToast('Faculty updated') } else showToast('Error updating faculty') }} style={S.input}>
                      <option value="">No faculty</option>
                      {faculties.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF' }}>STUDENTS ({selectedBatch.enrolments.length}/4)</div>
                    {selectedBatch.enrolments.length < 4 && (
                      <button onClick={()=>{ setShowAddStudent(v=>!v); setAddStudentSearch(''); setAddStudentResults([]) }} style={{ background:'rgba(108,60,225,0.15)', border:'1px solid rgba(108,60,225,0.3)', color:'#8B5CF6', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>+ Add</button>
                    )}
                  </div>
                  {showAddStudent && (
                    <div style={{ background:'#242436', borderRadius:12, padding:12, marginBottom:10 }}>
                      <input value={addStudentSearch} onChange={async e=>{ setAddStudentSearch(e.target.value); const res=await fetch('/api/clients?q='+encodeURIComponent(e.target.value)); if(res.ok) setAddStudentResults(await res.json()) }} placeholder="Search student..." style={{ ...S.input, marginBottom: addStudentResults.length>0?8:0 }} />
                      {addStudentResults.filter(c=>!selectedBatch.enrolments.some(e=>e.clientId===c.id)).map(c=>(
                        <div key={c.id} onClick={async()=>{
                          const res = await fetch('/api/batches/'+selectedBatch.id, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({addClientId:c.id})})
                          const data = await res.json()
                          if(res.ok){ setSelectedBatch(data); loadBatches(); setShowAddStudent(false); showToast(c.name+' added to batch') }
                          else showToast(data.error||'Error adding student')
                        }} style={{ padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid #2A2A3D', fontSize:14, color:'#F5F5F7', display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:8, background:avatarColor(c.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, color:'white' }}>{getInitials(c.name)}</div>
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {selectedBatch.enrolments.map(e=>(
                      <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8, background:'#242436', borderRadius:10, padding:'8px 12px' }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:avatarColor(e.client.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, color:'white' }}>{getInitials(e.client.name)}</div>
                        <span style={{ fontSize:13, fontWeight:500 }}>{e.client.name}</span>
                        <button onClick={async()=>{ if(!confirm('Remove '+e.client.name+' from batch?')) return; const res=await fetch('/api/batches/'+selectedBatch.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({removeClientId:e.clientId})}); const data=await res.json(); if(res.ok){ setSelectedBatch(data); loadBatches(); showToast(e.client.name+' removed') } }} style={{ background:'none', border:'none', color:'#6B7280', cursor:'pointer', fontSize:14, padding:0, marginLeft:2 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF', marginBottom:8 }}>UPCOMING SESSIONS ({selectedBatch.bookings.filter(b=>new Date(b.startTime)>=new Date()).length})</div>
                {(() => {
                  const todayM = new Date(); todayM.setHours(0,0,0,0)
                  const upcoming = selectedBatch.bookings.filter(b=>new Date(b.startTime)>=todayM)
                  return upcoming.slice(0,10).map((b,i)=>(
                    <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #2A2A3D', fontSize:13 }}>
                      <div>
                        <div style={{ color:'#F5F5F7' }}>{new Date(b.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                        <div style={{ color:'#9CA3AF', fontSize:12 }}>{fmtTime12(b.startTime)}</div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        {i===0 && (
                          <button onClick={async()=>{
                            if(!confirm('Push all '+upcoming.length+' sessions forward by one batch day?')) return
                            const res = await fetch('/api/batches/'+selectedBatch.id+'/push', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fromBookingId:b.id})})
                            const data = await res.json()
                            if(res.ok){ loadBookings(); loadBatches(); showToast(data.shifted+' sessions pushed forward') }
                            else showToast(data.error || 'Error pushing sessions')
                          }} style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B', borderRadius:8, padding:'4px 8px', fontSize:11, fontWeight:600, cursor:'pointer' }}>Push all</button>
                        )}
                        <button onClick={async()=>{
                          if(!confirm('Push all sessions from this date forward?')) return
                          const res = await fetch('/api/batches/'+selectedBatch.id+'/push', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fromBookingId:b.id})})
                          const data = await res.json()
                          if(res.ok){ loadBookings(); loadBatches(); showToast(data.shifted+' sessions pushed forward') }
                          else showToast(data.error || 'Error pushing sessions')
                        }} style={{ background:'rgba(108,60,225,0.15)', border:'1px solid rgba(108,60,225,0.3)', color:'#8B5CF6', borderRadius:8, padding:'4px 8px', fontSize:11, fontWeight:600, cursor:'pointer' }}>Push from here</button>
                        <button onClick={()=>handleBookingDelete(b.id)} style={{ background:'none', border:'none', color:'#EF4444', fontSize:12, cursor:'pointer', padding:'4px 8px' }}>Cancel</button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
              <button onClick={()=>handleCancelBatch(selectedBatch.id)} style={S.btnDanger}>Delete Entire Batch</button>
            </>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>Active Batches</h2>
                <button onClick={openBatchModal} style={{ background:'linear-gradient(135deg,#6C3CE1,#8B5CF6)', border:'none', borderRadius:10, padding:'8px 14px', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ New Batch</button>
              </div>
              {batches.length===0 ? <EmptyState text="No active batches" /> : batches.map(batch=>(
                <div key={batch.id} onClick={()=>setSelectedBatch(batch)} style={{ ...S.card, borderLeft:`4px solid ${batch.color}`, cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{batch.name}</div>
                      <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:6 }}>{roomBadge(batch.room).label} · {(() => { const [h,m]=batch.startTime.split(':').map(Number); const ampm=h>=12?'PM':'AM'; const h12=h%12||12; return h12+':'+(m<10?'0'+m:m)+' '+ampm })() } · {batch.duration}h{batch.faculty ? <span style={{color:'#A78BFA'}}> · 🎓 {batch.faculty.name}</span> : null}</div>
                      <div style={{ fontSize:12, color:'#6B7280' }}>{batch.repeatDays.split(',').map(d=>DAYS[Number(d)]).join(', ')} · until {batch.endDate}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:batch.color }}>{batch.enrolments.length}</div>
                      <div style={{ fontSize:11, color:'#6B7280' }}>students</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                    {batch.enrolments.map(e=>(
                      <div key={e.id} style={{ width:28, height:28, borderRadius:8, background:avatarColor(e.client.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, color:'white' }}>{getInitials(e.client.name)}</div>
                    ))}
                    <span style={{ fontSize:12, color:'#6B7280', alignSelf:'center', marginLeft:4 }}>{batch.bookings.filter(b=>new Date(b.startTime)>=new Date()).length} sessions left</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}


      {/* Students */}
      {tab==='students' && (
        <div style={S.page}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>Students</h2>
            <button onClick={()=>{ setShowNewClientDirect(true) }} style={{ background:'linear-gradient(135deg,#6C3CE1,#8B5CF6)', border:'none', borderRadius:10, padding:'8px 14px', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add Student</button>
          </div>
          {showNewClientDirect && (
            <div style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:14, padding:16, marginBottom:16 }}>
              <input value={directClientName} onChange={e=>setDirectClientName(e.target.value)} placeholder="Student name *" style={{ ...S.input, marginBottom:8 }} />
              <input value={directClientPhone} onChange={e=>setDirectClientPhone(e.target.value)} placeholder="Phone (optional)" style={{ ...S.input, marginBottom:8 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={async()=>{ if(!directClientName.trim()) return; const res=await fetch('/api/clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:directClientName.trim(),phone:directClientPhone.trim()})}); if(res.ok){setDirectClientName('');setDirectClientPhone('');setShowNewClientDirect(false);loadAllClients();showToast('Student added!')} }} style={{ flex:1, background:'#6C3CE1', color:'white', border:'none', borderRadius:10, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
                <button onClick={()=>setShowNewClientDirect(false)} style={{ background:'none', border:'1px solid #2A2A3D', color:'#9CA3AF', borderRadius:10, padding:'10px 16px', fontSize:13, cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ color:'#9CA3AF' }}>🔍</span>
            <input value={clientListSearch} onChange={e=>setClientListSearch(e.target.value)} placeholder="Search students..." style={{ background:'transparent', border:'none', color:'#F5F5F7', fontSize:14, outline:'none', width:'100%', fontFamily:'inherit' }} />
          </div>
          {allClients.filter(c=>!clientListSearch||c.name.toLowerCase().includes(clientListSearch.toLowerCase())).map(c=>(
            <div key={c.id} style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:14, marginBottom:10, overflow:'hidden' }}>
              {editingClientId===c.id ? (
                <div style={{ padding:14 }}>
                  <input value={editClientName} onChange={e=>setEditClientName(e.target.value)} placeholder="Name *" style={{ ...S.input, marginBottom:8 }} />
                  <input value={editClientPhone} onChange={e=>setEditClientPhone(e.target.value)} placeholder="Phone (optional)" style={{ ...S.input, marginBottom:10 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={async()=>{ const res=await fetch('/api/clients/'+c.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:editClientName,phone:editClientPhone})}); if(res.ok){ setEditingClientId(null); loadAllClients(); showToast('Student updated') } }} style={{ flex:1, background:'#6C3CE1', color:'white', border:'none', borderRadius:10, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
                    <button onClick={()=>setEditingClientId(null)} style={{ background:'none', border:'1px solid #2A2A3D', color:'#9CA3AF', borderRadius:10, padding:'10px 16px', fontSize:13, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:avatarColor(c.name), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'white', flexShrink:0 }}>{getInitials(c.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{c.name}</div>
                    {c.phone && <div style={{ fontSize:13, color:'#9CA3AF', marginTop:2 }}>{c.phone}</div>}
                    <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{(() => {
                    const nowMidnight = new Date(); nowMidnight.setHours(0,0,0,0)
                    const remainingBatch = batches.filter(bt=>bt.enrolments.some(e=>e.clientId===c.id)).reduce((sum,bt)=>sum+bt.bookings.filter(b=>new Date(b.startTime)>=nowMidnight).length,0)
                    const remainingDirect = allBookings.filter(b=>b.clientId===c.id&&!b.batchId&&new Date(b.startTime)>=nowMidnight).length
                    const absenceCount = c._count?.absences || 0
                    const total = remainingBatch + remainingDirect
                    return <>{total} session{total!==1?'s':''} left{absenceCount>0 ? <span style={{color:'#EF4444'}}> · {absenceCount} absent</span> : null}</>
                  })()}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <button onClick={()=>{ setEditingClientId(c.id); setEditClientName(c.name); setEditClientPhone(c.phone??'') }} style={{ background:'rgba(108,60,225,0.15)', border:'1px solid rgba(108,60,225,0.3)', color:'#8B5CF6', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Edit</button>
                    <button onClick={()=>{ setAbsenceModal(c); loadAbsences(c.id) }} style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Attendance</button>
                    <button onClick={async()=>{ if(!confirm('Delete ' + c.name + '? This will cancel all their bookings.')) return; const res=await fetch('/api/clients/'+c.id,{method:'DELETE'}); if(res.ok){ setAllClients(prev=>prev.filter(cl=>cl.id!==c.id)); loadBookings(); showToast('Student deleted') } else { showToast('Error deleting student') } }} style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {allClients.length===0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'#4B5563' }}><div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>👥</div><div style={{ fontSize:13 }}>No students yet</div></div>}
        </div>
      )}

      {/* Tab bar */}
      <div style={S.tabBar}>
        {([['dashboard','Home','🏠'],['calendar','Booking Calendar','📅'],['batches','Batches','📚'],['students','Students','👥'],['faculty','Faculty','🎓']] as const).map(([id,label,icon])=>(
          <button key={id} onClick={()=>{ setTab(id); if(id==='students') loadAllClients(); if(id==='faculty') loadFaculties() }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 16px', borderRadius:12, border:'none', background:tab===id?'rgba(108,60,225,0.15)':'transparent', color:tab===id?'#8B5CF6':'#9CA3AF', fontSize:11, fontWeight:500, cursor:'pointer' }}>
            <span style={{ fontSize:20 }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowBookingModal(false)}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:'24px 24px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, background:'#2A2A3D', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>{editBooking?'Edit Booking': bookingForm.type==='demo'?'Demo Class':'Practice Session'}</h2>
              <button onClick={()=>setShowBookingModal(false)} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>Student *</label>
              <input value={clientSearch} onChange={e=>{setClientSearch(e.target.value);setBookingForm(f=>({...f,clientId:''}))}} placeholder="Search student name..." style={S.input} />
              {clientSearch&&!bookingForm.clientId&&clients.filter(c=>c.name.toLowerCase().includes(clientSearch.toLowerCase())).length>0&&(
                <div style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:12, marginTop:4, overflow:'hidden' }}>
                  {clients.filter(c=>c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c=>(
                    <div key={c.id} onClick={()=>{setBookingForm(f=>({...f,clientId:String(c.id)}));setClientSearch(c.name)}} style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #2A2A3D', fontSize:14, color:'#F5F5F7' }}>
                      {c.name}{c.phone&&<span style={{ color:'#6B7280', fontSize:12 }}> · {c.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
              {!bookingForm.clientId&&<button onClick={()=>setShowNewClient(v=>!v)} style={{ fontSize:13, color:'#8B5CF6', background:'none', border:'none', cursor:'pointer', marginTop:8, padding:0 }}>+ Add new student</button>}
              {showNewClient&&(
                <div style={{ background:'#242436', borderRadius:12, padding:12, marginTop:8 }}>
                  <input value={newClientName} onChange={e=>setNewClientName(e.target.value)} placeholder="Student name *" style={{ ...S.input, marginBottom:8 }} />
                  <input value={newClientPhone} onChange={e=>setNewClientPhone(e.target.value)} placeholder="Phone (optional)" style={{ ...S.input, marginBottom:8 }} />
                  <button onClick={handleNewClient} style={{ background:'#6C3CE1', color:'white', border:'none', borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save student</button>
                </div>
              )}
            </div>
            {[{label:'Room',key:'room',type:'select',options:ROOMS.map(r=>({value:r.value,label:r.label}))},{label:'Date *',key:'date',type:'datepicker'},{label:'Start Time *',key:'startTime',type:'time'},{label:'Duration',key:'duration',type:'select',options:DURATIONS.map(d=>({value:String(d),label:`${d} Hour${d>1?'s':''}`}))},{label:'Notes',key:'notes',type:'text',placeholder:'Any special requirements...'}].map(f=>(
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={S.label}>{f.label}</label>
                {f.type==='select'
                  ?<select value={(bookingForm as any)[f.key]} onChange={e=>setBookingForm(prev=>({...prev,[f.key]:e.target.value}))} style={S.input}>
                    {f.options!.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  :f.type==='datepicker'
                  ?<DatePickerInput value={bookingForm.date} onChange={d=>setBookingForm(prev=>({...prev,date:d}))} room={bookingForm.room} />
                  :<input type={f.type} value={(bookingForm as any)[f.key]} onChange={e=>setBookingForm(prev=>({...prev,[f.key]:e.target.value}))} placeholder={f.placeholder} style={S.input} />
                }
              </div>
            ))}
            {formError&&<div style={{ color:'#EF4444', fontSize:13, marginBottom:12, padding:'10px 14px', background:'rgba(239,68,68,0.1)', borderRadius:10 }}>{formError}</div>}
            <button onClick={handleBookingSubmit} disabled={loading} style={S.btnPrimary}>{loading?'Saving...':editBooking?'Save Changes':'Create Booking'}</button>
            {editBooking&&!editBooking.batchId&&<button onClick={()=>handleBookingDelete(editBooking.id)} style={{ ...S.btnDanger, marginTop:10 }}>Cancel Booking</button>}
            {editBooking?.batchId&&<div style={{ fontSize:12, color:'#6B7280', textAlign:'center', marginTop:10 }}>This is a batch session — cancel from the Batches tab</div>}
            <button onClick={()=>setShowBookingModal(false)} style={{ width:'100%', padding:12, marginTop:8, background:'none', border:'none', color:'#6B7280', fontSize:14, cursor:'pointer' }}>Dismiss</button>
          </div>
        </div>
      )}

            {/* Batch / Course Modal */}
      {showBatchModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowBatchModal(false)}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:'24px 24px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, background:'#2A2A3D', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>New DJ Batch</h2>
              <button onClick={()=>setShowBatchModal(false)} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:24, cursor:'pointer' }}>×</button>
            </div>

            {/* Day pair */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Schedule *</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {([['tue-thu','Tuesday & Thursday','Weekday'],['wed-fri','Wednesday & Friday','Weekday'],['sat-sun','Saturday & Sunday','Weekend']] as const).map(([val,label,type])=>(
                  <button key={val} onClick={()=>{ setBatchForm(f=>({ ...f, dayPair:val, name:autoName(val, batches.length) })) }}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderRadius:12, cursor:'pointer', background:batchForm.dayPair===val?'rgba(108,60,225,0.2)':'#242436', border:`1.5px solid ${batchForm.dayPair===val?'#6C3CE1':'#2A2A3D'}`, color:batchForm.dayPair===val?'#A78BFA':'#F5F5F7', textAlign:'left' }}>
                    <span style={{ fontWeight:600, fontSize:14 }}>{label}</span>
                    <span style={{ fontSize:12, color:batchForm.dayPair===val?'#8B5CF6':'#6B7280', background:batchForm.dayPair===val?'rgba(108,60,225,0.2)':'#1A1A24', padding:'3px 8px', borderRadius:6 }}>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Time Slot * <span style={{ color:'#6B7280', fontWeight:400 }}>(2 hrs each)</span></label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {(['10:00','12:00','14:00','16:00','18:00','20:00'] as const).map(t=>(
                  <button key={t} onClick={()=>setBatchForm(f=>({...f,timeSlot:t}))}
                    style={{ padding:'12px', borderRadius:12, cursor:'pointer', background:batchForm.timeSlot===t?'rgba(108,60,225,0.2)':'#242436', border:`1.5px solid ${batchForm.timeSlot===t?'#6C3CE1':'#2A2A3D'}`, color:batchForm.timeSlot===t?'#A78BFA':'#F5F5F7', fontWeight:600, fontSize:14 }}>
                    {getTimeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Room */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Room</label>
              <div style={{ display:'flex', gap:8 }}>
                {ROOMS.map(r=>(
                  <button key={r.value} onClick={()=>setBatchForm(f=>({...f,room:r.value}))}
                    style={{ flex:1, padding:'12px', borderRadius:12, cursor:'pointer', background:batchForm.room===r.value?'rgba(108,60,225,0.2)':'#242436', border:`1.5px solid ${batchForm.room===r.value?'#6C3CE1':'#2A2A3D'}`, color:batchForm.room===r.value?'#A78BFA':'#F5F5F7', fontWeight:600, fontSize:13 }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start date */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Start Date * {batchForm.dayPair && <span style={{ color:'#6B7280', fontWeight:400 }}>({batchForm.dayPair==='tue-thu'?'must be Tue or Thu':batchForm.dayPair==='wed-fri'?'must be Wed or Fri':'must be Sat or Sun'})</span>}</label>
              <DatePickerInput value={batchForm.startDate} onChange={d=>setBatchForm(f=>({...f,startDate:d}))} room={batchForm.room} />
              {batchForm.dayPair && batchForm.startDate && (()=>{
                const day = new Date(batchForm.startDate+'T00:00:00').getDay()
                const days = getDayPairDays(batchForm.dayPair)
                const ok = days.includes(day)
                const endDate = (() => {
                  if (!ok) return null
                  let count=0, cur=new Date(batchForm.startDate+'T00:00:00')
                  while(count<16){ if(days.includes(cur.getDay())) count++; if(count<16) cur.setDate(cur.getDate()+1) }
                  return cur.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                })()
                return ok
                  ? <div style={{ fontSize:12, color:'#34D399', marginTop:6 }}>✓ 16 sessions · ends {endDate}</div>
                  : <div style={{ fontSize:12, color:'#EF4444', marginTop:6 }}>⚠ Pick a {batchForm.dayPair==='tue-thu'?'Tuesday or Thursday':batchForm.dayPair==='wed-fri'?'Wednesday or Friday':'Saturday or Sunday'}</div>
              })()}
            </div>

            {/* Batch name (auto but editable) */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Batch Name <span style={{ color:'#6B7280', fontWeight:400 }}>(auto-generated)</span></label>
              <input value={batchForm.name} onChange={e=>setBatchForm(f=>({...f,name:e.target.value}))} placeholder="e.g. DJ Weekday Batch 3" style={S.input} />
            </div>

            {/* Faculty */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Faculty (optional)</label>
              <select value={batchForm.facultyId} onChange={e=>setBatchForm(f=>({...f,facultyId:e.target.value}))} style={S.input}>
                <option value="">No faculty assigned</option>
                {faculties.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Students */}
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Students (max 4) — {batchForm.clientIds.length}/4</label>
              <input value={batchClientSearch} onChange={e=>setBatchClientSearch(e.target.value)} placeholder="Search and add students..." style={{ ...S.input, marginBottom:8 }} />
              {batchClientSearch&&(
                <div style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
                  {batchClients.filter(c=>c.name.toLowerCase().includes(batchClientSearch.toLowerCase())).map(c=>(
                    <div key={c.id} onClick={()=>toggleBatchClient(c.id)} style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #2A2A3D', fontSize:14, color:'#F5F5F7', display:'flex', justifyContent:'space-between', alignItems:'center', background:batchForm.clientIds.includes(c.id)?'rgba(108,60,225,0.15)':'transparent' }}>
                      <span>{c.name}</span>
                      {batchForm.clientIds.includes(c.id)&&<span style={{ color:'#8B5CF6', fontWeight:700 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
              {batchForm.clientIds.length>0&&(
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {batchForm.clientIds.map(id=>{ const c=batchClients.find(cl=>cl.id===id); if(!c) return null; return (
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(108,60,225,0.15)', border:'1px solid rgba(108,60,225,0.3)', borderRadius:8, padding:'6px 10px', fontSize:13 }}>
                      {c.name}<button onClick={()=>toggleBatchClient(id)} style={{ background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', fontSize:14, padding:0 }}>×</button>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {formError&&<div style={{ color:'#EF4444', fontSize:13, marginBottom:12, padding:'10px 14px', background:'rgba(239,68,68,0.1)', borderRadius:10 }}>{formError}</div>}

            <div style={{ background:'rgba(108,60,225,0.1)', border:'1px solid rgba(108,60,225,0.2)', borderRadius:12, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#A78BFA' }}>
              📚 16 classes · 2 hrs each · 2 per week · ~8 weeks total
            </div>

            <button onClick={handleBatchSubmit} disabled={loading} style={S.btnPrimary}>{loading?'Booking 16 sessions...':'Create Batch & Book All Sessions'}</button>
            <button onClick={()=>setShowBatchModal(false)} style={{ width:'100%', padding:12, marginTop:8, background:'none', border:'none', color:'#6B7280', fontSize:14, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Faculty */}
      {tab==='faculty' && (
        <div style={S.page}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700 }}>Faculty</h2>
            <button onClick={()=>setShowNewFaculty(v=>!v)} style={{ background:'linear-gradient(135deg,#6C3CE1,#8B5CF6)', border:'none', borderRadius:10, padding:'8px 14px', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add Faculty</button>
          </div>

          {/* Month selector for stats */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <button onClick={()=>{ let m=selectedMonth-1,y=selectedMonthYear; if(m<0){m=11;y--} setSelectedMonth(m);setSelectedMonthYear(y) }} style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:8, padding:'6px 10px', color:'white', cursor:'pointer' }}>‹</button>
            <div style={{ flex:1, textAlign:'center', fontSize:14, fontWeight:600, color:'#F5F5F7' }}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth]} {selectedMonthYear}</div>
            <button onClick={()=>{ let m=selectedMonth+1,y=selectedMonthYear; if(m>11){m=0;y++} setSelectedMonth(m);setSelectedMonthYear(y) }} style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:8, padding:'6px 10px', color:'white', cursor:'pointer' }}>›</button>
          </div>

          {showNewFaculty && (
            <div style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:14, padding:16, marginBottom:16 }}>
              <input value={newFacultyName} onChange={e=>setNewFacultyName(e.target.value)} placeholder="Faculty name *" style={{ ...S.input, marginBottom:8 }} />
              <input value={newFacultyPhone} onChange={e=>setNewFacultyPhone(e.target.value)} placeholder="Phone (optional)" style={{ ...S.input, marginBottom:10 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={async()=>{ if(!newFacultyName.trim()) return; const res=await fetch('/api/faculty',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newFacultyName.trim(),phone:newFacultyPhone.trim()})}); if(res.ok){setNewFacultyName('');setNewFacultyPhone('');setShowNewFaculty(false);loadFaculties();showToast('Faculty added!')} }} style={{ flex:1, background:'#6C3CE1', color:'white', border:'none', borderRadius:10, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
                <button onClick={()=>setShowNewFaculty(false)} style={{ background:'none', border:'1px solid #2A2A3D', color:'#9CA3AF', borderRadius:10, padding:'10px 16px', fontSize:13, cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background:'#242436', border:'1px solid #2A2A3D', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ color:'#9CA3AF' }}>🔍</span>
            <input value={facultyListSearch} onChange={e=>setFacultyListSearch(e.target.value)} placeholder="Search faculty..." style={{ background:'transparent', border:'none', color:'#F5F5F7', fontSize:14, outline:'none', width:'100%', fontFamily:'inherit' }} />
          </div>

          {faculties.filter(f=>!facultyListSearch||f.name.toLowerCase().includes(facultyListSearch.toLowerCase())).map(f=>(
            <div key={f.id} style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:14, marginBottom:10, overflow:'hidden' }}>
              {editingFacultyId===f.id ? (
                <div style={{ padding:14 }}>
                  <input value={editFacultyName} onChange={e=>setEditFacultyName(e.target.value)} placeholder="Name *" style={{ ...S.input, marginBottom:8 }} />
                  <input value={editFacultyPhone} onChange={e=>setEditFacultyPhone(e.target.value)} placeholder="Phone" style={{ ...S.input, marginBottom:10 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={async()=>{ const res=await fetch('/api/faculty/'+f.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:editFacultyName,phone:editFacultyPhone})}); if(res.ok){setEditingFacultyId(null);loadFaculties();showToast('Faculty updated')} }} style={{ flex:1, background:'#6C3CE1', color:'white', border:'none', borderRadius:10, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
                    <button onClick={()=>setEditingFacultyId(null)} style={{ background:'none', border:'1px solid #2A2A3D', color:'#9CA3AF', borderRadius:10, padding:'10px 16px', fontSize:13, cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6C3CE1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, color:'white', flexShrink:0 }}>🎓</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{f.name}</div>
                    {f.phone && <div style={{ fontSize:13, color:'#9CA3AF', marginTop:2 }}>{f.phone}</div>}
                    <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
                      {(()=>{
                        const som = new Date(selectedMonthYear, selectedMonth, 1)
                        const eom = new Date(selectedMonthYear, selectedMonth+1, 1)
                        const monthBatches = batches.filter(bt=>bt.facultyId===f.id)
                        const monthSessions = allBookings.filter(b=>b.batchId&&monthBatches.some(bt=>bt.id===b.batchId)&&new Date(b.startTime)>=som&&new Date(b.startTime)<eom).length
                        return <>{monthSessions} classes this month{f.batches && f.batches.length>0 ? <span style={{color:'#8B5CF6'}}> · {f.batches.length} active batch{f.batches.length>1?'es':''}</span> : null}</>
                      })()}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <button onClick={()=>{ setEditingFacultyId(f.id); setEditFacultyName(f.name); setEditFacultyPhone(f.phone??'') }} style={{ background:'rgba(108,60,225,0.15)', border:'1px solid rgba(108,60,225,0.3)', color:'#8B5CF6', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Edit</button>
                    <button onClick={()=>{ setFacultyAttendanceModal(f); loadFacultyAttendance(f.id) }} style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Attend.</button>
                    <button onClick={async()=>{ if(!confirm('Remove '+f.name+'?')) return; const res=await fetch('/api/faculty/'+f.id,{method:'DELETE'}); if(res.ok){loadFaculties();showToast('Faculty removed')} }} style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {faculties.length===0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'#4B5563' }}><div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>🎓</div><div style={{ fontSize:13 }}>No faculty added yet</div></div>}
        </div>
      )}

      {/* Faculty Attendance Modal */}
      {facultyAttendanceModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setFacultyAttendanceModal(null)}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:'24px 24px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, background:'#2A2A3D', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Attendance — {facultyAttendanceModal.name}</h2>
              <button onClick={()=>setFacultyAttendanceModal(null)} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>
              {facultyAttendance.filter(a=>a.present).length} classes conducted · {facultyAttendance.filter(a=>!a.present).length} absent
            </div>
            {(()=>{
              const facultyBatches = batches.filter(bt=>bt.facultyId===facultyAttendanceModal.id)
              const allSessions = facultyBatches.flatMap(bt=>bt.bookings.map(b=>({...b,batchName:bt.name,batchColor:bt.color}))).sort((a,b)=>a.startTime.localeCompare(b.startTime))
              if (allSessions.length===0) return <div style={{ textAlign:'center', padding:'30px 0', color:'#4B5563', fontSize:13 }}>No sessions assigned to this faculty</div>
              const todayM = new Date(); todayM.setHours(0,0,0,0)
              const tomorrowM = new Date(todayM); tomorrowM.setDate(tomorrowM.getDate()+1)
              const future = allSessions.filter(s=>new Date(s.startTime)>=tomorrowM)
              const todayAndPast = allSessions.filter(s=>new Date(s.startTime)<tomorrowM)
              const past = todayAndPast.filter(s=>new Date(s.startTime)<todayM)
              const todaySess = todayAndPast.filter(s=>new Date(s.startTime)>=todayM)
              return (<>
                {future.length>0 && <>
                  <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF', marginBottom:10 }}>UPCOMING ({future.length})</div>
                  {future.map(s=>(
                    <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#1A1A24', borderRadius:12, marginBottom:8, border:'1px solid #2A2A3D', opacity:0.6 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#6B7280' }}>{new Date(s.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                        <div style={{ fontSize:12, color:'#4B5563', marginTop:2 }}>{fmtTime12(s.startTime)} · <span style={{color:s.batchColor}}>{s.batchName}</span></div>
                      </div>
                      <span style={{ fontSize:11, color:'#4B5563', fontStyle:'italic' }}>Upcoming</span>
                    </div>
                  ))}
                </>}
                {todaySess.length>0 && <>
                  <div style={{ fontSize:12, fontWeight:600, color:'#34D399', marginBottom:10 }}>TODAY ({todaySess.length})</div>
                  {todaySess.map(s=>{
                    const rec = facultyAttendance.find(a=>a.bookingId===s.id)
                    const isAbsent = rec && !rec.present
                    return (
                      <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#242436', borderRadius:12, marginBottom:8, border:`1px solid ${isAbsent?'rgba(239,68,68,0.3)':'rgba(52,211,153,0.2)'}` }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:isAbsent?'#EF4444':'#34D399' }}>{new Date(s.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                          <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{fmtTime12(s.startTime)} · <span style={{color:s.batchColor}}>{s.batchName}</span></div>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={async()=>{ if(!confirm('Mark '+facultyAttendanceModal!.name+' as present?')) return; await fetch('/api/faculty-attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({facultyId:facultyAttendanceModal!.id,bookingId:s.id,present:true})}); loadFacultyAttendance(facultyAttendanceModal!.id) }} style={{ padding:'6px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:(!isAbsent&&rec)?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.05)', color:(!isAbsent&&rec)?'#34D399':'#6B7280' }}>✓</button>
                          <button onClick={async()=>{ if(!confirm('Mark '+facultyAttendanceModal!.name+' as absent?')) return; await fetch('/api/faculty-attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({facultyId:facultyAttendanceModal!.id,bookingId:s.id,present:false})}); loadFacultyAttendance(facultyAttendanceModal!.id) }} style={{ padding:'6px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:isAbsent?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)', color:isAbsent?'#EF4444':'#6B7280' }}>✗</button>
                        </div>
                      </div>
                    )
                  })}
                </>}
                {past.length>0 && <>
                  <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF', margin:'16px 0 10px' }}>PAST ({past.length})</div>
                  {past.map(s=>{
                    const rec = facultyAttendance.find(a=>a.bookingId===s.id)
                    const isAbsent = rec && !rec.present
                    const isPresent = rec && rec.present
                    return (
                      <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#1A1A24', borderRadius:12, marginBottom:8, border:`1px solid ${isAbsent?'rgba(239,68,68,0.3)':isPresent?'rgba(52,211,153,0.3)':'#2A2A3D'}`, opacity:0.9 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:isAbsent?'#EF4444':isPresent?'#34D399':'#9CA3AF' }}>{new Date(s.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                          <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{fmtTime12(s.startTime)} · <span style={{color:s.batchColor}}>{s.batchName}</span></div>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={async()=>{ if(!confirm('Mark '+facultyAttendanceModal.name+' as present?')) return; await fetch('/api/faculty-attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({facultyId:facultyAttendanceModal.id,bookingId:s.id,present:true})}); loadFacultyAttendance(facultyAttendanceModal.id) }} style={{ padding:'6px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:isPresent?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.05)', color:isPresent?'#34D399':'#6B7280' }}>✓</button>
                          <button onClick={async()=>{ if(!confirm('Mark '+facultyAttendanceModal.name+' as absent?')) return; await fetch('/api/faculty-attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({facultyId:facultyAttendanceModal.id,bookingId:s.id,present:false})}); loadFacultyAttendance(facultyAttendanceModal.id) }} style={{ padding:'6px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:isAbsent?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)', color:isAbsent?'#EF4444':'#6B7280' }}>✗</button>
                        </div>
                      </div>
                    )
                  })}
                </>}
              </>)
            })()}
          </div>
        </div>
      )}

      {/* Absence Modal */}
      {absenceModal && (
        <div onClick={e=>{if(e.target===e.currentTarget){setAbsenceModal(null)}}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#1A1A24', border:'1px solid #2A2A3D', borderRadius:'24px 24px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, background:'#2A2A3D', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Attendance — {absenceModal.name}</h2>
              <button onClick={()=>setAbsenceModal(null)} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>{absences.length} absence{absences.length!==1?'s':''} recorded</div>

            {/* Sessions from batches this student is in */}
            {(() => {
              const studentBatches = batches.filter(bt=>bt.enrolments.some(e=>e.clientId===absenceModal.id))
              const allSessions = studentBatches.flatMap(bt=>bt.bookings.map(b=>({...b, batchName:bt.name, batchColor:bt.color})))
                .sort((a,b)=>a.startTime.localeCompare(b.startTime))
              if (allSessions.length === 0) return <div style={{ textAlign:'center', padding:'30px 0', color:'#4B5563', fontSize:13 }}>No batch sessions found</div>

              const todayStr = fmtDate(new Date())
              const _todayM3 = new Date(); _todayM3.setHours(0,0,0,0)
              const _tomM3 = new Date(_todayM3); _tomM3.setDate(_tomM3.getDate()+1)
              const upcoming = allSessions.filter(s=>new Date(s.startTime)>=_tomM3)
              const todaySess = allSessions.filter(s=>new Date(s.startTime)>=_todayM3&&new Date(s.startTime)<_tomM3)
              const past = allSessions.filter(s=>new Date(s.startTime)<_todayM3)

              return (
                <>
                  {upcoming.length>0 && <>
                    <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF', marginBottom:10 }}>UPCOMING ({upcoming.length})</div>
                    {upcoming.map(s=>(
                      <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#1A1A24', borderRadius:12, marginBottom:8, border:'1px solid #2A2A3D', opacity:0.6 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#6B7280' }}>{new Date(s.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                          <div style={{ fontSize:12, color:'#4B5563', marginTop:2 }}>{fmtTime12(s.startTime)} · <span style={{color:s.batchColor}}>{s.batchName}</span></div>
                        </div>
                        <span style={{ fontSize:11, color:'#4B5563', fontStyle:'italic' }}>Upcoming</span>
                      </div>
                    ))}
                  </>}
                  {todaySess.length>0 && <>
                    <div style={{ fontSize:12, fontWeight:600, color:'#34D399', marginBottom:10 }}>TODAY ({todaySess.length})</div>
                    {todaySess.map(s=>{
                      const isAbsent = absences.some(a=>a.bookingId===s.id)
                      return (
                        <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#242436', borderRadius:12, marginBottom:8, border:`1px solid ${isAbsent?'rgba(239,68,68,0.3)':'rgba(52,211,153,0.2)'}` }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:isAbsent?'#EF4444':'#34D399' }}>{new Date(s.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{fmtTime12(s.startTime)} · <span style={{color:s.batchColor}}>{s.batchName}</span></div>
                          </div>
                          <button onClick={async()=>{
                            if(isAbsent){ if(!confirm('Remove absence for '+absenceModal!.name+'?')) return; await fetch('/api/absences',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:absenceModal!.id,bookingId:s.id})}) }
                            else { if(!confirm('Mark '+absenceModal!.name+' as absent for this session?')) return; await fetch('/api/absences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:absenceModal!.id,bookingId:s.id})}) }
                            loadAbsences(absenceModal!.id); loadAllClients()
                          }} style={{ padding:'6px 12px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background:isAbsent?'rgba(239,68,68,0.2)':'rgba(108,60,225,0.15)', color:isAbsent?'#EF4444':'#8B5CF6' }}>
                            {isAbsent?'✗ Absent':'Mark Absent'}
                          </button>
                        </div>
                      )
                    })}
                  </>}
                  {past.length>0 && <>
                    <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF', margin:'16px 0 10px' }}>PAST ({past.length})</div>
                    {past.map(s=>{
                      const isAbsent = absences.some(a=>a.bookingId===s.id)
                      return (
                        <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#1A1A24', borderRadius:12, marginBottom:8, border:`1px solid ${isAbsent?'rgba(239,68,68,0.3)':'#2A2A3D'}`, opacity:0.8 }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color: isAbsent?'#EF4444':'#9CA3AF' }}>{new Date(s.startTime).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>
                            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{fmtTime12(s.startTime)} · <span style={{color:s.batchColor}}>{s.batchName}</span></div>
                          </div>
                          <button onClick={async()=>{
                            if(isAbsent){
                              await fetch('/api/absences',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:absenceModal.id,bookingId:s.id})})
                            } else {
                              await fetch('/api/absences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:absenceModal.id,bookingId:s.id})})
                            }
                            loadAbsences(absenceModal.id); loadAllClients()
                          }} style={{ padding:'6px 12px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background: isAbsent?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)', color: isAbsent?'#EF4444':'#6B7280' }}>
                            {isAbsent ? '✗ Absent' : 'Mark Absent'}
                          </button>
                        </div>
                      )
                    })}
                  </>}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position:'fixed', bottom:90, left:'50%', transform:`translateX(-50%) translateY(${toastOn?0:20}px)`, background:'#242436', border:'1px solid #2A2A3D', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:500, zIndex:300, opacity:toastOn?1:0, transition:'all 0.3s', boxShadow:'0 8px 24px rgba(0,0,0,0.4)', whiteSpace:'nowrap', pointerEvents:'none' }}>{toast}</div>
    </div>
  )
}
