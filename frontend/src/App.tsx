import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { HouseDetailPage } from './pages/HouseDetailPage'
import { ModelsPage } from './pages/ModelsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <HomePage />
              <Footer />
            </>
          }
        />
        <Route
          path="/houses/:id"
          element={
            <>
              <Header />
              <HouseDetailPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/models"
          element={
            <>
              <Header />
              <ModelsPage />
              <Footer />
            </>
          }
        />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
