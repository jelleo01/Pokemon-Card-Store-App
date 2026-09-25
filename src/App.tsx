import PointsPage from '@/pages/PointsPage'
import PointsHistoryPage from '@/pages/PointsHistoryPage'
import PointNotifications from '@/components/ui/PointNotifications'
import { Routes, Route } from 'react-router-dom'
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
  return (
    <>
    <PointNotifications />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth-wall" element={<AuthWallPage />} />
      <Route path="/policy" element={<PolicyPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/points" element={<PointsPage />} />
        <Route path="/points/history" element={<PointsHistoryPage />} />
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
    </>
  )
}
