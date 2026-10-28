import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import RequireAuth from '@/components/RequireAuth'
import HomePage from '@/pages/HomePage'
import MapPage from '@/pages/MapPage'
import LocationSearchPage from '@/pages/LocationSearchPage'
import LoginPage from '@/pages/LoginPage'
import OnboardingPage from '@/pages/OnboardingPage'
import AuthWallPage from '@/pages/AuthWallPage'
import PostPage from '@/pages/PostPage'
import CommunityPage from '@/pages/CommunityPage'
import PostDetailPage from '@/pages/PostDetailPage'
import ProfilePage from '@/pages/ProfilePage'
import ShopDetailPage from '@/pages/ShopDetailPage'
import NoticesPage from '@/pages/NoticesPage'
import InquiryPage from '@/pages/InquiryPage'
import PolicyPage from '@/pages/PolicyPage'
import AdminPage from '@/pages/AdminPage'
import MyPostsPage from '@/pages/MyPostsPage'

export default function App() {
  // Android 뒤로가기: 히스토리가 있으면 이전 화면, 없으면 앱 종료
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else CapApp.exitApp()
    })
    return () => { sub.then(l => l.remove()) }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth-wall" element={<AuthWallPage />} />
      <Route path="/policy" element={<PolicyPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/location" element={<LocationSearchPage />} />
        <Route path="/shop/:id" element={<ShopDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/post" element={<PostPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/inquiry" element={<InquiryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/my-posts" element={<MyPostsPage />} />
      </Route>
    </Routes>
  )
}
