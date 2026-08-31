// Demo data generator. Runs once per SCHEMA_VERSION (see db.ts) and populates
// every collection with a realistic coaching-centre dataset so the product can be
// demoed with no backend. Deterministic RNG => the demo looks identical each load.

import { COLLECTIONS, genId, save, saveAll } from './db'
import { defaultModuleStates } from './modules'
import { DEFAULT_ROLES } from './permissions'
import type {
  Assignment,
  AttendanceRecord,
  Batch,
  Course,
  Enrollment,
  Exam,
  ExamResult,
  FeeInvoice,
  Guardian,
  Institute,
  Material,
  Message,
  Notification,
  Payment,
  PlatformInvoice,
  Staff,
  StaffAttendanceRecord,
  Student,
  StudentDocument,
  Subject,
  Submission,
  SubscriptionPlan,
  SupportTicket,
  TimetableSlot,
  User
} from './types'

let _s = 20260901
function rnd() {
  _s = (_s * 1664525 + 1013904223) % 4294967296
  return _s / 4294967296
}
function pick<T>(a: T[]): T {
  return a[Math.floor(rnd() * a.length)]
}
function sample<T>(a: T[], n: number): T[] {
  const copy = [...a]
  const out: T[] = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0])
  return out
}
function int(min: number, max: number) {
  return Math.floor(rnd() * (max - min + 1)) + min
}
function chance(p: number) {
  return rnd() < p
}
function isoDaysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function dateDaysAgo(n: number) {
  return isoDaysAgo(n).slice(0, 10)
}
function dateDaysAhead(n: number) {
  return isoDaysAgo(-n).slice(0, 10)
}

const FIRST_M = ['Aarav', 'Rohan', 'Aditya', 'Krish', 'Ishaan', 'Arjun', 'Vivaan', 'Kabir', 'Rudra', 'Dev', 'Ayush', 'Sarthak', 'Nikhil', 'Harsh', 'Yash']
const FIRST_F = ['Riya', 'Ananya', 'Isha', 'Sneha', 'Diya', 'Aisha', 'Kavya', 'Meera', 'Tara', 'Nisha', 'Pooja', 'Sanya', 'Aditi', 'Trisha', 'Ira']
const LAST = ['Sen', 'Gupta', 'Sharma', 'Iyer', 'Nair', 'Das', 'Bose', 'Chatterjee', 'Mukherjee', 'Reddy', 'Rao', 'Patel', 'Singh', 'Verma', 'Ghosh', 'Banerjee']
const CITIES = ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati', 'Jamshedpur']
const AREAS = ['Salt Lake Sector 2', 'Behala', 'Garia', 'Dumdum', 'Shibpur', 'Bidhannagar', 'Tollygunge', 'Ballygunge', 'New Town', 'Barasat']

export function seedAll(): void {
  // ---- platform / access ----
  saveAll(COLLECTIONS.roles, DEFAULT_ROLES)
  saveAll(COLLECTIONS.moduleStates, defaultModuleStates())
  save(COLLECTIONS.organization, {
    id: 'org_1',
    name: 'Pathfinder Coaching Classes',
    tagline: 'JEE · NEET · Foundation · Since 2011',
    gstin: '19ABCDE1234F1Z5',
    address: '2nd Floor, Vidya Bhavan, GT Road, Shibpur, Howrah 711102',
    phone: '+91 98300 11223',
    email: 'office@pathfinder.example',
    upiId: 'pathfinder@okhdfcbank'
  })
  save(COLLECTIONS.settings, {
    currency: 'INR',
    receiptPrefix: 'PCC/RCPT',
    academicYear: '2025-26',
    lateFeePerDay: 20,
    whatsappSenderName: 'Pathfinder Coaching'
  })

  // ---- subjects ----
  const subjectDefs: [string, string][] = [
    ['Physics', 'PHY'],
    ['Chemistry', 'CHE'],
    ['Mathematics', 'MAT'],
    ['Biology', 'BIO'],
    ['English', 'ENG'],
    ['Logical Reasoning', 'LR'],
    ['Quantitative Aptitude', 'QA'],
    ['General Awareness', 'GA'],
    ['Science', 'SCI'],
    ['Social Studies', 'SST'],
    ['Spoken English', 'SPK']
  ]
  const subjects: Subject[] = subjectDefs.map(([name, code]) => ({ id: genId('sub'), name, code }))
  const subId = (code: string) => subjects.find((s) => s.code === code)!.id
  saveAll(COLLECTIONS.subjects, subjects)

  // ---- staff ----
  const staffSeed: [string, Staff['role'], string[]][] = [
    ['Anup Chatterjee', 'Center Head', ['MAT']],
    ['Dr. S. Ramanujan', 'Teacher', ['MAT']],
    ['Kavita Iyer', 'Teacher', ['PHY']],
    ['Rohit Deshmukh', 'Teacher', ['CHE']],
    ['Meera Nair', 'Teacher', ['BIO']],
    ['Farhan Qureshi', 'Teacher', ['ENG', 'SPK']],
    ['P. Venkatesh', 'Teacher', ['QA', 'LR', 'GA']],
    ['Sneha Das', 'Front Desk', []],
    ['Rakesh Gupta', 'Accountant', []]
  ]
  const staff: Staff[] = staffSeed.map(([name, role, subs], i) => ({
    id: genId('stf'),
    staffCode: `PCC-T${String(i + 1).padStart(2, '0')}`,
    name,
    role,
    subjects: subs,
    phone: `+91 9${int(100000000, 999999999)}`,
    email: `${name.split(' ')[0].toLowerCase()}@pathfinder.example`,
    salary: role === 'Center Head' ? 85000 : role === 'Teacher' ? int(38000, 62000) : int(22000, 30000),
    joiningDate: dateDaysAgo(int(400, 2600)),
    status: 'ACTIVE',
    createdAt: isoDaysAgo(int(400, 2600))
  }))
  const teacherByCode = (code: string) => staff.find((s) => s.role === 'Teacher' && s.subjects.includes(code)) ?? staff[1]
  const frontDesk = staff.find((s) => s.role === 'Front Desk')!
  const accountant = staff.find((s) => s.role === 'Accountant')!
  const head = staff.find((s) => s.role === 'Center Head')!
  saveAll(COLLECTIONS.staff, staff)

  // ---- courses ----
  const courseSeed: [string, Course['category'], number, number, string[]][] = [
    ['IIT-JEE (Two-Year)', 'Competitive', 24, 185000, ['PHY', 'CHE', 'MAT']],
    ['NEET (Two-Year)', 'Competitive', 24, 195000, ['PHY', 'CHE', 'BIO']],
    ['Foundation (Class IX–X)', 'School', 12, 48000, ['SCI', 'MAT', 'ENG', 'SST']],
    ['CBSE XI–XII (PCM)', 'School', 12, 65000, ['PHY', 'CHE', 'MAT']],
    ['SSC / Bank PO', 'Competitive', 10, 32000, ['QA', 'LR', 'GA', 'ENG']],
    ['Spoken English', 'Skill', 3, 9000, ['SPK']]
  ]
  const courses: Course[] = courseSeed.map(([name, category, durationMonths, totalFees, subs]) => ({
    id: genId('crs'),
    name,
    category,
    durationMonths,
    totalFees,
    subjectIds: subs.map(subId),
    teacherStaffIds: subs.map((c) => teacherByCode(c).id).filter((v, i, a) => a.indexOf(v) === i),
    status: 'ACTIVE',
    createdAt: isoDaysAgo(int(700, 2000))
  }))
  saveAll(COLLECTIONS.courses, courses)

  // ---- batches ----
  const batchSeed: [string, number, string, string[], string][] = [
    ['JEE Morning', 0, '06:30–09:30', ['Mon', 'Wed', 'Fri'], 'MAT'],
    ['JEE Evening', 0, '17:00–20:00', ['Tue', 'Thu', 'Sat'], 'PHY'],
    ['NEET Morning', 1, '07:00–10:00', ['Mon', 'Wed', 'Fri'], 'BIO'],
    ['NEET Evening', 1, '17:30–20:30', ['Tue', 'Thu', 'Sat'], 'CHE'],
    ['Foundation A', 2, '16:00–18:00', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'SCI'],
    ['CBSE XI–XII', 3, '15:00–17:30', ['Mon', 'Wed', 'Fri'], 'PHY'],
    ['SSC Weekend', 4, '10:00–14:00', ['Sat', 'Sun'], 'QA'],
    ['Spoken English Eve', 5, '18:00–19:00', ['Tue', 'Thu'], 'SPK']
  ]
  const batches: Batch[] = batchSeed.map(([name, ci, timing, days, teachCode], i) => ({
    id: genId('bat'),
    name,
    courseId: courses[ci].id,
    timing,
    daysOfWeek: days,
    capacity: int(20, 40),
    teacherStaffId: teacherByCode(teachCode).id,
    room: `Room ${i + 1}`,
    status: 'ACTIVE',
    createdAt: isoDaysAgo(int(400, 900))
  }))
  saveAll(COLLECTIONS.batches, batches)

  // ---- students + guardians + enrollments + documents ----
  const students: Student[] = []
  const guardians: Guardian[] = []
  const enrollments: Enrollment[] = []
  const documents: StudentDocument[] = []
  let admCounter = 1
  batches.forEach((batch) => {
    const course = courses.find((c) => c.id === batch.courseId)!
    const count = int(5, 9)
    for (let k = 0; k < count; k++) {
      const female = chance(0.46)
      const first = female ? pick(FIRST_F) : pick(FIRST_M)
      const last = pick(LAST)
      const name = `${first} ${last}`
      const joiningDaysAgo = chance(0.14) ? int(2, 26) : int(27, 430)
      const status: Student['status'] = chance(0.06) ? 'DROPPED' : chance(0.05) ? 'COMPLETED' : 'ACTIVE'
      const st: Student = {
        id: genId('std'),
        admissionNo: `PCC-2024-${String(admCounter++).padStart(3, '0')}`,
        name,
        photoUrl: '',
        gender: female ? 'Female' : 'Male',
        dob: dateDaysAgo(int(365 * 14, 365 * 19)),
        mobile: `+91 8${int(100000000, 999999999)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        address: `${int(1, 90)}, ${pick(AREAS)}, ${pick(CITIES)}`,
        parentName: `${chance(0.5) ? pick(FIRST_M) : pick(FIRST_F)} ${last}`,
        parentPhone: `+91 9${int(100000000, 999999999)}`,
        courseId: course.id,
        batchId: batch.id,
        subjectIds: course.subjectIds,
        joiningDate: dateDaysAgo(joiningDaysAgo),
        expectedCompletion: dateDaysAhead(course.durationMonths * 30 - joiningDaysAgo),
        status,
        createdAt: isoDaysAgo(joiningDaysAgo)
      }
      students.push(st)
      guardians.push({
        id: genId('grd'),
        studentId: st.id,
        name: st.parentName,
        relation: chance(0.55) ? 'Father' : 'Mother',
        phone: st.parentPhone,
        email: `parent.${first.toLowerCase()}@example.com`,
        occupation: pick(['Business', 'Service', 'Teacher', 'Doctor', 'Engineer', 'Govt. Employee', 'Homemaker'])
      })
      enrollments.push({
        id: genId('enr'),
        studentId: st.id,
        courseId: course.id,
        batchId: batch.id,
        enrolledAt: st.createdAt
      })
      const docTypes: StudentDocument['type'][] = sample(['Aadhaar', 'Photo', 'Previous Marksheet', 'Other'], int(1, 3))
      docTypes.forEach((t) =>
        documents.push({
          id: genId('doc'),
          studentId: st.id,
          type: t,
          name: `${t.toLowerCase().replace(/ /g, '_')}_${st.admissionNo}.pdf`,
          uploadedAt: isoDaysAgo(joiningDaysAgo - int(0, 5))
        })
      )
    }
  })
  saveAll(COLLECTIONS.students, students)
  saveAll(COLLECTIONS.guardians, guardians)
  saveAll(COLLECTIONS.enrollments, enrollments)
  saveAll(COLLECTIONS.documents, documents)

  // ---- fees: installment invoices + payments ----
  const feeInvoices: FeeInvoice[] = []
  const payments: Payment[] = []
  let invCounter = 1
  let rcptCounter = 1
  students
    .filter((s) => s.status !== 'DROPPED')
    .forEach((st) => {
      const course = courses.find((c) => c.id === st.courseId)!
      const parts = course.totalFees > 60000 ? 4 : course.totalFees > 20000 ? 3 : 2
      const per = Math.round(course.totalFees / parts / 500) * 500
      const joinT = new Date(st.joiningDate).getTime()
      for (let p = 0; p < parts; p++) {
        const due = new Date(joinT + p * 75 * 86400000)
        const dueStr = due.toISOString().slice(0, 10)
        const overdueDays = Math.round((Date.now() - due.getTime()) / 86400000)
        const inv: FeeInvoice = {
          id: genId('inv'),
          invoiceNo: `PCC/INV/${String(invCounter++).padStart(4, '0')}`,
          studentId: st.id,
          courseId: course.id,
          title: `Installment ${p + 1} of ${parts}`,
          amount: p === parts - 1 ? course.totalFees - per * (parts - 1) : per,
          dueDate: dueStr,
          status: 'PENDING',
          paidAmount: 0,
          createdAt: st.createdAt
        }
        // decide paid state: older installments mostly paid
        if (overdueDays > 30 && chance(0.9)) {
          inv.status = 'PAID'
          inv.paidAmount = inv.amount
        } else if (overdueDays > 0 && overdueDays <= 30) {
          if (chance(0.55)) {
            inv.status = 'PAID'
            inv.paidAmount = inv.amount
          } else if (chance(0.4)) {
            inv.status = 'PARTIAL'
            inv.paidAmount = Math.round(inv.amount * 0.5)
          } else {
            inv.status = 'OVERDUE'
          }
        } else if (overdueDays > 0) {
          inv.status = 'OVERDUE'
        } else {
          inv.status = 'PENDING'
        }
        feeInvoices.push(inv)
        if (inv.paidAmount > 0) {
          const paidAt = new Date(due.getTime() - int(0, 10) * 86400000).toISOString()
          const collector = chance(0.5) ? frontDesk : accountant
          payments.push({
            id: genId('pay'),
            receiptNo: `PCC/RCPT/${String(rcptCounter++).padStart(4, '0')}`,
            invoiceId: inv.id,
            studentId: st.id,
            amount: inv.paidAmount,
            mode: pick(['Cash', 'UPI', 'UPI', 'Bank Transfer', 'Card']),
            reference: chance(0.6) ? `TXN${int(100000, 999999)}` : '',
            collectedByStaffId: collector.id,
            note: inv.status === 'PARTIAL' ? 'Part payment, balance promised next week' : '',
            sentWhatsapp: chance(0.8),
            sentEmail: chance(0.4),
            paidAt
          })
        }
      }
    })
  // Pull a slice of collections into the last few weeks so "collected this month"
  // and recent-receipt views look alive on first load.
  for (let i = 0; i < Math.min(22, payments.length); i++) {
    payments[Math.floor(rnd() * payments.length)].paidAt = isoDaysAgo(int(0, 24))
  }
  saveAll(COLLECTIONS.feeInvoices, feeInvoices)
  saveAll(COLLECTIONS.payments, payments)

  // ---- attendance: last N class days per batch ----
  const attendance: AttendanceRecord[] = []
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  batches.forEach((batch) => {
    const roster = students.filter((s) => s.batchId === batch.id && s.status === 'ACTIVE')
    let recorded = 0
    for (let d = 1; d <= 40 && recorded < 16; d++) {
      const day = new Date()
      day.setDate(day.getDate() - d)
      if (!batch.daysOfWeek.includes(DOW[day.getDay()])) continue
      recorded++
      const dateStr = day.toISOString().slice(0, 10)
      roster.forEach((st) => {
        const r = rnd()
        const status: AttendanceRecord['status'] = r < 0.84 ? 'PRESENT' : r < 0.92 ? 'LATE' : 'ABSENT'
        attendance.push({
          id: genId('att'),
          batchId: batch.id,
          studentId: st.id,
          date: dateStr,
          status,
          markedByStaffId: batch.teacherStaffId
        })
      })
    }
  })
  saveAll(COLLECTIONS.attendance, attendance)

  // ---- exams + results ----
  const exams: Exam[] = []
  const examResults: ExamResult[] = []
  const examTypes: Exam['type'][] = ['Weekly Test', 'Weekly Test', 'Mock Test', 'Monthly Test']
  batches.forEach((batch) => {
    const course = courses.find((c) => c.id === batch.courseId)!
    const roster = students.filter((s) => s.batchId === batch.id && s.status === 'ACTIVE')
    // 2 completed + 1 scheduled
    for (let e = 0; e < 3; e++) {
      const scheduled = e === 2
      const subjId = pick(course.subjectIds)
      const maxMarks = pick([25, 50, 100])
      const exam: Exam = {
        id: genId('exm'),
        name: `${batch.name} ${scheduled ? 'Upcoming' : ''} ${examTypes[e]}`.replace(/\s+/g, ' ').trim(),
        type: examTypes[e],
        courseId: course.id,
        batchId: batch.id,
        subjectId: subjId,
        date: scheduled ? dateDaysAhead(int(3, 20)) : dateDaysAgo(int(6, 60)),
        maxMarks,
        status: scheduled ? 'SCHEDULED' : 'COMPLETED',
        createdAt: isoDaysAgo(int(60, 90))
      }
      exams.push(exam)
      if (!scheduled) {
        roster.forEach((st) => {
          if (chance(0.08)) return // absent
          const base = 0.45 + rnd() * 0.5
          examResults.push({
            id: genId('res'),
            examId: exam.id,
            studentId: st.id,
            marks: Math.min(exam.maxMarks, Math.round(exam.maxMarks * base)),
            remark: base > 0.8 ? 'Excellent' : base > 0.6 ? 'Good' : base > 0.45 ? 'Needs work' : 'Poor — meet parent'
          })
        })
      }
    }
  })
  saveAll(COLLECTIONS.exams, exams)
  saveAll(COLLECTIONS.examResults, examResults)

  // ---- homework / assignments + submissions ----
  const assignments: Assignment[] = []
  const submissions: Submission[] = []
  batches.forEach((batch) => {
    const course = courses.find((c) => c.id === batch.courseId)!
    const roster = students.filter((s) => s.batchId === batch.id && s.status === 'ACTIVE')
    for (let a = 0; a < 2; a++) {
      const subjId = pick(course.subjectIds)
      const assignedAgo = int(2, 25)
      const asn: Assignment = {
        id: genId('asn'),
        title: `${pick(['Worksheet', 'Problem Set', 'Revision Sheet', 'DPP'])} ${int(1, 12)}`,
        batchId: batch.id,
        subjectId: subjId,
        description: 'Complete all questions and submit a scanned copy or hand it in at the front desk.',
        attachmentName: `worksheet_${batch.name.replace(/ /g, '_').toLowerCase()}_${a + 1}.pdf`,
        assignedDate: dateDaysAgo(assignedAgo),
        dueDate: dateDaysAgo(assignedAgo - 7),
        createdByStaffId: batch.teacherStaffId
      }
      assignments.push(asn)
      roster.forEach((st) => {
        if (chance(0.28)) return
        const late = chance(0.15)
        submissions.push({
          id: genId('sbm'),
          assignmentId: asn.id,
          studentId: st.id,
          submittedAt: isoDaysAgo(assignedAgo - (late ? 5 : 8)),
          attachmentName: `${st.admissionNo}_answer.pdf`,
          status: chance(0.5) ? 'GRADED' : late ? 'LATE' : 'SUBMITTED',
          grade: chance(0.5) ? pick(['A', 'B+', 'B', 'C', 'A+']) : ''
        })
      })
    }
  })
  saveAll(COLLECTIONS.assignments, assignments)
  saveAll(COLLECTIONS.submissions, submissions)

  // ---- study materials ----
  const materials: Material[] = []
  const matKinds: Material['kind'][] = ['PDF', 'Notes', 'Video', 'Assignment']
  courses.forEach((course) => {
    course.subjectIds.forEach((sid) => {
      const n = int(1, 3)
      for (let m = 0; m < n; m++) {
        const kind = pick(matKinds)
        const subj = subjects.find((s) => s.id === sid)!
        materials.push({
          id: genId('mat'),
          title: `${subj.name} — ${pick(['Chapter Notes', 'Formula Sheet', 'Solved Examples', 'Previous Year Qs', 'Crash Revision'])}`,
          courseId: course.id,
          subjectId: sid,
          kind,
          fileName: `${subj.code}_${pick(['notes', 'formula', 'pyq', 'revision'])}.${kind === 'Video' ? 'mp4' : 'pdf'}`,
          sizeLabel: kind === 'Video' ? `${int(80, 480)} MB` : `${int(300, 9000)} KB`,
          uploadedByStaffId: teacherByCode(subj.code).id,
          uploadedAt: isoDaysAgo(int(3, 120)),
          downloads: int(0, 140)
        })
      }
    })
  })
  saveAll(COLLECTIONS.materials, materials)

  // ---- timetable ----
  const timetable: TimetableSlot[] = []
  batches.forEach((batch) => {
    const course = courses.find((c) => c.id === batch.courseId)!
    const [start] = batch.timing.split('–')
    batch.daysOfWeek.forEach((day, di) => {
      const subjId = course.subjectIds[di % course.subjectIds.length]
      const subj = subjects.find((s) => s.id === subjId)!
      const sh = parseInt(start.split(':')[0], 10)
      timetable.push({
        id: genId('tt'),
        batchId: batch.id,
        day,
        startTime: start.trim(),
        endTime: `${String(sh + 2).padStart(2, '0')}:00`,
        subjectId: subjId,
        teacherStaffId: teacherByCode(subj.code).id,
        room: batch.room
      })
    })
  })
  saveAll(COLLECTIONS.timetable, timetable)

  // ---- communication log ----
  const messages: Message[] = []
  const msgTemplates: [Message['category'], Message['channel'], string][] = [
    ['Fee Reminder', 'whatsapp', 'Dear Parent, fee installment for {name} is due on {date}. Please pay to avoid a late fee. — Pathfinder Coaching'],
    ['Attendance Alert', 'sms', '{name} was marked ABSENT today. Please ensure regular attendance. — Pathfinder'],
    ['Exam Notification', 'whatsapp', 'Reminder: {batch} Mock Test is scheduled for {date}. Syllabus shared on the portal.'],
    ['General', 'email', 'Diwali break: classes remain closed from 20–23 Oct. Regular schedule resumes 24 Oct.']
  ]
  for (let i = 0; i < 16; i++) {
    const [category, channel, body] = pick(msgTemplates)
    messages.push({
      id: genId('msg'),
      ts: isoDaysAgo(int(0, 40)),
      channel,
      category,
      audience: chance(0.6) ? `Batch: ${pick(batches).name}` : `Student: ${pick(students).name}`,
      recipientCount: chance(0.6) ? int(12, 45) : 1,
      body,
      sentByUserId: 'user_owner',
      status: chance(0.92) ? 'SENT' : 'FAILED'
    })
  }
  saveAll(COLLECTIONS.messages, messages)

  // ---- staff attendance ----
  const staffAttendance: StaffAttendanceRecord[] = []
  staff.forEach((s) => {
    for (let d = 1; d <= 24; d++) {
      const day = new Date()
      day.setDate(day.getDate() - d)
      if (day.getDay() === 0) continue
      const r = rnd()
      staffAttendance.push({
        id: genId('sat'),
        staffId: s.id,
        date: day.toISOString().slice(0, 10),
        status: r < 0.88 ? 'PRESENT' : r < 0.93 ? 'HALF_DAY' : r < 0.97 ? 'LEAVE' : 'ABSENT'
      })
    }
  })
  saveAll(COLLECTIONS.staffAttendance, staffAttendance)

  // ---- users (logins) ----
  const demoStudent = students.find((s) => s.status === 'ACTIVE')!
  const users: User[] = [
    mkUser('user_super', 'Thikaana Platform', 'superadmin', 'super123', 'role_super_admin'),
    mkUser('user_owner', head.name, 'owner', 'owner123', 'role_owner', { linkedStaffId: head.id }),
    mkUser('user_teacher', staff[2].name, 'teacher', 'teacher123', 'role_staff', { linkedStaffId: staff[2].id }),
    mkUser('user_accountant', accountant.name, 'accountant', 'account123', 'role_accountant', { linkedStaffId: accountant.id }),
    mkUser('user_student', demoStudent.name, 'student', 'student123', 'role_student', { linkedStudentId: demoStudent.id }),
    mkUser('user_parent', demoStudent.parentName, 'parent', 'parent123', 'role_parent', { linkedStudentId: demoStudent.id })
  ]
  saveAll(COLLECTIONS.users, users)

  // ---- notifications ----
  const overdueCount = feeInvoices.filter((i) => i.status === 'OVERDUE').length
  const nextExam = exams.find((e) => e.status === 'SCHEDULED')
  const notifications: Notification[] = [
    n('Fees', 'in-app', `${overdueCount} fee installments are overdue`, 'warning', '/fees/dues'),
    n('Admissions', 'in-app', `${students.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 30 * 86400000).length} new admissions this month`, 'info', '/students'),
    n('Exams', 'in-app', nextExam ? `${nextExam.name} on ${nextExam.date}` : 'No exams scheduled', 'info', '/exams'),
    n('Attendance', 'in-app', 'JEE Morning attendance dropped below 80% yesterday', 'warning', '/attendance'),
    n('System', 'in-app', 'This deployment has no live database yet — demo data only', 'info', undefined)
  ]
  saveAll(COLLECTIONS.notifications, notifications)

  // ---- super admin platform console ----
  const plans: SubscriptionPlan[] = [
    { id: 'plan_starter', name: 'Starter', pricePerMonth: 499, studentLimit: 50, features: ['Up to 50 students', 'Fees + Attendance + Exams', 'WhatsApp receipts', 'Single user'] },
    { id: 'plan_growth', name: 'Growth', pricePerMonth: 999, studentLimit: 250, features: ['Up to 250 students', 'All modules', 'Staff logins', 'Parent portal', 'Priority support'] },
    { id: 'plan_pro', name: 'Professional', pricePerMonth: 1999, studentLimit: -1, features: ['Unlimited students', 'All modules + AI Insights', 'Multi-batch reports', 'Dedicated onboarding'] }
  ]
  saveAll(COLLECTIONS.subscriptions, plans)

  const instNames = ['Pathfinder Coaching Classes', 'Brilliant Minds Academy', 'Apex Career Institute', 'Genius Point Tutorials', 'Vidyalaya Classes', 'Concept IIT-JEE', 'MedPrep NEET Academy', 'Sharma Sir Physics', 'Target 100 Coaching', 'Elite Study Circle', 'Nucleus Learning', 'Gyan Ganga Tuition', 'Rankers Zone', 'Scholars Hub']
  const institutes: Institute[] = instNames.map((name, i) => {
    const plan = i === 0 ? plans[1] : pick(plans)
    const status: Institute['status'] = i === 0 ? 'ACTIVE' : chance(0.15) ? 'TRIAL' : chance(0.1) ? 'SUSPENDED' : 'ACTIVE'
    return {
      id: i === 0 ? 'inst_self' : genId('inst'),
      name,
      ownerName: `${pick(FIRST_M)} ${pick(LAST)}`,
      city: pick(CITIES),
      phone: `+91 9${int(100000000, 999999999)}`,
      plan: plan.name,
      studentCount: plan.name === 'Professional' ? int(300, 900) : plan.name === 'Growth' ? int(90, 240) : int(12, 48),
      status,
      mrr: status === 'SUSPENDED' ? 0 : plan.pricePerMonth,
      joinedAt: dateDaysAgo(int(30, 800)),
      renewsAt: dateDaysAhead(int(1, 30))
    }
  })
  saveAll(COLLECTIONS.institutes, institutes)

  const platformInvoices: PlatformInvoice[] = []
  let pinv = 1
  institutes.forEach((inst) => {
    for (let m = 0; m < 3; m++) {
      const d = new Date()
      d.setMonth(d.getMonth() - m)
      platformInvoices.push({
        id: genId('pin'),
        invoiceNo: `THK/${d.getFullYear()}/${String(pinv++).padStart(4, '0')}`,
        instituteId: inst.id,
        amount: plans.find((p) => p.name === inst.plan)!.pricePerMonth,
        period: `${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`,
        status: m === 0 ? (chance(0.6) ? 'PAID' : 'DUE') : chance(0.95) ? 'PAID' : 'FAILED',
        issuedAt: d.toISOString()
      })
    }
  })
  saveAll(COLLECTIONS.platformInvoices, platformInvoices)

  const ticketSubjects = ['WhatsApp receipts not sending', 'How do I import students from Excel?', 'Need extra staff login', 'Attendance report shows wrong %', 'Upgrade to Professional plan', 'Change UPI ID on receipts', 'Bulk fee reminder failed', 'Add a new batch mid-session']
  const supportTickets: SupportTicket[] = ticketSubjects.map((subject, i) => ({
    id: genId('tkt'),
    ticketNo: `THK-${String(101 + i)}`,
    instituteId: pick(institutes).id,
    subject,
    priority: pick(['Low', 'Medium', 'Medium', 'High']),
    status: pick(['OPEN', 'OPEN', 'IN_PROGRESS', 'RESOLVED']),
    openedAt: isoDaysAgo(int(0, 25))
  }))
  saveAll(COLLECTIONS.supportTickets, supportTickets)
}

function mkUser(id: string, name: string, username: string, password: string, roleId: string, extra: Partial<User> = {}): User {
  return {
    id,
    name,
    username,
    email: `${username}@pathfinder.example`,
    mobile: `+91 90000 000${username.length}`,
    password,
    roleId,
    status: 'ACTIVE',
    createdAt: isoDaysAgo(300),
    ...extra
  }
}

function n(type: string, channel: Notification['channel'], message: string, severity: Notification['severity'], link?: string): Notification {
  return {
    id: genId('ntf'),
    ts: isoDaysAgo(Math.floor(Math.random() * 5)),
    type,
    channel,
    title: type,
    message,
    read: false,
    severity,
    link
  }
}
