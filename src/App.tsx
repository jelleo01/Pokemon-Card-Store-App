import { Routes, Route } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import HomePage from '@/pages/HomePage'
import MapPage from '@/pages/MapPage'
import LocationSearchPage from '@/pages/LocationSearchPage'
import LoginPage from '@/pages/LoginPage'
import AuthWallPage from '@/pages/AuthWallPage'
import PostPage from '@/pages/PostPage'
import CommunityPage from '@/pages/CommunityPage'
import PostDetailPage from '@/pages/PostDetailPage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/location" element={<LocationSearchPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth-wall" element={<AuthWallPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/post" element={<PostPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
