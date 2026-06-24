import { About } from '../components/About'
import { Contact } from '../components/Contact'
import { Hero } from '../components/Hero'
import { HousePortfolio } from '../components/HousePortfolio'

export function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <HousePortfolio />
      <Contact />
    </main>
  )
}
