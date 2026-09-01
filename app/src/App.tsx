import React from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ModuleProvider } from './context/ModuleContext'
import Layout from './components/Layout'
import PortalLayout from './components/PortalLayout'
import Gate from './components/Gate'
import { PARENT_NAV, PLATFORM_NAV, STUDENT_NAV } from './lib/nav'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

import Students from './pages/students/Students'
import Courses from './pages/academics/Courses'
import Batches from './pages/academics/Batches'
import Attendance from './pages/academics/Attendance'
import Exams from './pages/academics/Exams'
import Homework from './pages/academics/Homework'
import Materials from './pages/academics/Materials'
import Timetable from './pages/academics/Timetable'

import FeeOverview from './pages/fees/FeeOverview'
import CollectPayment from './pages/fees/CollectPayment'
import Receipts from './pages/fees/Receipts'
import DueAlerts from './pages/fees/DueAlerts'

import Communication from './pages/engagement/Communication'
import StaffPage from './pages/ops/Staff'
import Reports from './pages/ops/Reports'

import AIInsights from './pages/advanced/AIInsights'
import OnlineClasses from './pages/advanced/OnlineClasses'
import IDCards from './pages/advanced/IDCards'
import Doubts from './pages/advanced/Doubts'

import NotificationsPage from './pages/system/Notifications'
import Modules from './pages/admin/Modules'
import Users from './pages/admin/Users'
import Roles from './pages/admin/Roles'
import Settings from './pages/admin/Settings'
import AuditLog from './pages/admin/AuditLog'

import StudentDashboard from './pages/student/StudentDashboard'
import MyAttendance from './pages/student/MyAttendance'
import MyFees from './pages/student/MyFees'
import MySubjects from './pages/student/MySubjects'
import MyResults from './pages/student/MyResults'
import MockTests from './pages/student/MockTests'
import TestRunner from './pages/student/TestRunner'
import MyHomework from './pages/student/MyHomework'
import MyMaterials from './pages/student/MyMaterials'
import MyTimetable from './pages/student/MyTimetable'

import ParentDashboard from './pages/parent/ParentDashboard'
import ChildFees from './pages/parent/ChildFees'
import ChildAttendance from './pages/parent/ChildAttendance'
import ChildProgress from './pages/parent/ChildProgress'

import PlatformDashboard from './pages/platform/PlatformDashboard'
import Institutes from './pages/platform/Institutes'
import Subscriptions from './pages/platform/Subscriptions'
import PlatformBilling from './pages/platform/PlatformBilling'
import Support from './pages/platform/Support'

function RequireAuth({ children }: { children: React.JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoutes() {
  return (
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Gate moduleId="students"><Students /></Gate>} />
      <Route path="/courses" element={<Gate moduleId="courses"><Courses /></Gate>} />
      <Route path="/batches" element={<Gate moduleId="batches"><Batches /></Gate>} />
      <Route path="/attendance" element={<Gate moduleId="attendance"><Attendance /></Gate>} />
      <Route path="/exams" element={<Gate moduleId="exams"><Exams /></Gate>} />
      <Route path="/homework" element={<Gate moduleId="homework"><Homework /></Gate>} />
      <Route path="/materials" element={<Gate moduleId="materials"><Materials /></Gate>} />
      <Route path="/timetable" element={<Gate moduleId="timetable"><Timetable /></Gate>} />
      <Route path="/fees" element={<Gate moduleId="fees"><FeeOverview /></Gate>} />
      <Route path="/fees/collect" element={<Gate moduleId="fees" action="create"><CollectPayment /></Gate>} />
      <Route path="/fees/receipts" element={<Gate moduleId="fees"><Receipts /></Gate>} />
      <Route path="/fees/dues" element={<Gate moduleId="fees"><DueAlerts /></Gate>} />
      <Route path="/communication" element={<Gate moduleId="communication"><Communication /></Gate>} />
      <Route path="/staff" element={<Gate moduleId="staff"><StaffPage /></Gate>} />
      <Route path="/reports" element={<Gate moduleId="reports"><Reports /></Gate>} />
      <Route path="/ai-insights" element={<Gate moduleId="ai_insights"><AIInsights /></Gate>} />
      <Route path="/online-classes" element={<Gate moduleId="online_classes"><OnlineClasses /></Gate>} />
      <Route path="/id-cards" element={<Gate moduleId="id_cards"><IDCards /></Gate>} />
      <Route path="/doubts" element={<Gate moduleId="doubts"><Doubts /></Gate>} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/admin/modules" element={<Modules />} />
      <Route path="/admin/users" element={<Users />} />
      <Route path="/admin/roles" element={<Roles />} />
      <Route path="/admin/settings" element={<Settings />} />
      <Route path="/admin/audit" element={<AuditLog />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
}

function StudentRoutes() {
  return (
    <Route element={<PortalLayout nav={STUDENT_NAV} brand="Student Portal" emoji="🎒" />}>
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/me/attendance" element={<Gate moduleId="attendance"><MyAttendance /></Gate>} />
      <Route path="/me/fees" element={<Gate moduleId="fees"><MyFees /></Gate>} />
      <Route path="/me/subjects" element={<MySubjects />} />
      <Route path="/me/tests" element={<Gate moduleId="exams"><MockTests /></Gate>} />
      <Route path="/me/tests/:examId" element={<Gate moduleId="exams"><TestRunner /></Gate>} />
      <Route path="/me/results" element={<Gate moduleId="exams"><MyResults /></Gate>} />
      <Route path="/me/homework" element={<Gate moduleId="homework"><MyHomework /></Gate>} />
      <Route path="/me/materials" element={<Gate moduleId="materials"><MyMaterials /></Gate>} />
      <Route path="/me/timetable" element={<Gate moduleId="timetable"><MyTimetable /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
}

function ParentRoutes() {
  return (
    <Route element={<PortalLayout nav={PARENT_NAV} brand="Parent Portal" emoji="👪" />}>
      <Route path="/" element={<ParentDashboard />} />
      <Route path="/child/fees" element={<Gate moduleId="fees"><ChildFees /></Gate>} />
      <Route path="/child/attendance" element={<Gate moduleId="attendance"><ChildAttendance /></Gate>} />
      <Route path="/child/progress" element={<Gate moduleId="exams"><ChildProgress /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
}

function PlatformRoutes() {
  return (
    <Route element={<PortalLayout nav={PLATFORM_NAV} brand="Thikaana · Platform" emoji="🛰️" />}>
      <Route path="/" element={<PlatformDashboard />} />
      <Route path="/platform/institutes" element={<Institutes />} />
      <Route path="/platform/subscriptions" element={<Subscriptions />} />
      <Route path="/platform/billing" element={<PlatformBilling />} />
      <Route path="/platform/support" element={<Support />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
}

function AppRoutes() {
  const { role } = useAuth()
  const portal = role?.portal ?? 'ADMIN'
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <ModuleProvider>
              <Outlet />
            </ModuleProvider>
          </RequireAuth>
        }
      >
        {portal === 'PLATFORM'
          ? PlatformRoutes()
          : portal === 'STUDENT'
          ? StudentRoutes()
          : portal === 'PARENT'
          ? ParentRoutes()
          : AdminRoutes()}
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
